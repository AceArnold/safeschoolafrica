const express = require('express')
const cors    = require('cors')
const path    = require('path')
const { getDb, saveDb } = require('./database')

const app  = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// ── Helper: query rows ──
function query(db, sql, params = []) {
  const stmt = db.prepare(sql)
  const result = stmt.getAsObject ? null : null
  const rows = []
  stmt.bind(params)
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function queryOne(db, sql, params = []) {
  const rows = query(db, sql, params)
  return rows[0] || null
}

function run(db, sql, params = []) {
  db.run(sql, params)
  saveDb()
}

// ────────────────────────────────────────────
// AUTH
// ────────────────────────────────────────────

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const db   = await getDb()
    const user = queryOne(db, 'SELECT * FROM users WHERE email = ? AND password = ?', [email, password])

    if (!user) return res.status(401).json({ error: 'Invalid email or password. Please try again.' })

    res.json({ id: user.id, email: user.email, role: user.role, name: user.name })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ────────────────────────────────────────────
// REPORTS
// ────────────────────────────────────────────

// GET /api/reports — get all reports
app.get('/api/reports', async (req, res) => {
  try {
    const db      = await getDb()
    const reports = query(db, 'SELECT * FROM reports ORDER BY urgent DESC, date DESC')
    // Convert sqlite integers back to booleans
    res.json(reports.map(normalizeReport))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/reports — submit a new report
app.post('/api/reports', async (req, res) => {
  try {
    const { studentId, studentName, category, description, location, urgent, anonymous } = req.body

    if (!category || !description) return res.status(400).json({ error: 'Category and description are required' })
    if (description.length < 20)   return res.status(400).json({ error: 'Description must be at least 20 characters' })
    if (description.length > 1000) return res.status(400).json({ error: 'Description must be under 1000 characters' })

    const id   = 'SSA-' + Date.now()
    const date = new Date().toISOString()

    const db = await getDb()
    run(db,
      'INSERT INTO reports (id, studentId, studentName, category, description, location, urgent, anonymous, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, studentId || 'anon', studentName || 'Anonymous', category, description, location || '', urgent ? 1 : 0, anonymous ? 1 : 0, 'new', date]
    )

    // Create audit entry
    run(db, 'INSERT INTO audit_logs (reportId, text, by, date, type) VALUES (?, ?, ?, ?, ?)',
      [id, 'Case created — report submitted', studentName || 'Anonymous', date, 'create'])

    // Create checklist
    run(db, 'INSERT INTO checklists (reportId, state) VALUES (?, ?)', [id, '{}'])

    res.status(201).json({ id, date })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/:id — get single report
app.get('/api/reports/:id', async (req, res) => {
  try {
    const db     = await getDb()
    const report = queryOne(db, 'SELECT * FROM reports WHERE id = ?', [req.params.id])
    if (!report) return res.status(404).json({ error: 'Report not found' })
    res.json(normalizeReport(report))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/reports/:id — update status or add note
app.patch('/api/reports/:id', async (req, res) => {
  try {
    const { status, note, updatedBy } = req.body
    const db     = await getDb()
    const report = queryOne(db, 'SELECT * FROM reports WHERE id = ?', [req.params.id])
    if (!report) return res.status(404).json({ error: 'Report not found' })

    if (status && status !== report.status) {
      run(db, 'UPDATE reports SET status = ? WHERE id = ?', [status, req.params.id])
      run(db, 'INSERT INTO audit_logs (reportId, text, by, date, type) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, `Status changed from "${report.status}" to "${status}"`, updatedBy || 'Staff', new Date().toISOString(), 'action'])
    }

    if (note && note.trim()) {
      run(db, 'INSERT INTO audit_logs (reportId, text, by, date, type) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, `Note: ${note.trim()}`, updatedBy || 'Staff', new Date().toISOString(), 'note'])
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ────────────────────────────────────────────
// AUDIT TRAIL
// ────────────────────────────────────────────

// GET /api/reports/:id/audit
app.get('/api/reports/:id/audit', async (req, res) => {
  try {
    const db   = await getDb()
    const logs = query(db, 'SELECT * FROM audit_logs WHERE reportId = ? ORDER BY date ASC', [req.params.id])
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/reports/:id/audit
app.post('/api/reports/:id/audit', async (req, res) => {
  try {
    const { text, by, type } = req.body
    if (!text) return res.status(400).json({ error: 'text is required' })

    const db = await getDb()
    run(db, 'INSERT INTO audit_logs (reportId, text, by, date, type) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, text, by || 'Staff', new Date().toISOString(), type || 'action'])

    res.status(201).json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ────────────────────────────────────────────
// CHECKLIST
// ────────────────────────────────────────────

// GET /api/reports/:id/checklist
app.get('/api/reports/:id/checklist', async (req, res) => {
  try {
    const db  = await getDb()
    const row = queryOne(db, 'SELECT state FROM checklists WHERE reportId = ?', [req.params.id])
    res.json(row ? JSON.parse(row.state) : {})
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/reports/:id/checklist
app.patch('/api/reports/:id/checklist', async (req, res) => {
  try {
    const { state } = req.body
    if (!state) return res.status(400).json({ error: 'state is required' })

    const db = await getDb()
    run(db, 'INSERT OR REPLACE INTO checklists (reportId, state) VALUES (?, ?)',
      [req.params.id, JSON.stringify(state)])

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ────────────────────────────────────────────
// ANALYTICS
// ────────────────────────────────────────────

// GET /api/analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const db      = await getDb()
    const reports = query(db, 'SELECT * FROM reports')

    const total    = reports.length
    const resolved = reports.filter(r => r.status === 'resolved').length
    const urgent   = reports.filter(r => r.urgent).length
    const resRate  = total > 0 ? Math.round((resolved / total) * 100) : 0

    const categories = ['Cyberbullying', 'Grooming', 'Harassment', 'Inappropriate content', 'Threats', 'Other']
    const catCounts  = categories.map(c => reports.filter(r => r.category === c).length)

    const statusCounts = {
      new:        reports.filter(r => r.status === 'new').length,
      inProgress: reports.filter(r => r.status === 'in-progress').length,
      escalated:  reports.filter(r => r.status === 'escalated').length,
      resolved,
    }

    // Monthly trend last 6 months
    const monthly = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const label = d.toLocaleString('default', { month: 'short' })
      const count = reports.filter(r => {
        const rd = new Date(r.date)
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear()
      }).length
      monthly.push({ label, count })
    }

    res.json({ total, resolved, urgent, resRate, categories, catCounts, statusCounts, monthly })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Fallback: serve index.html ──
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// ── Helper ──
function normalizeReport(r) {
  return {
    ...r,
    urgent:    r.urgent === 1 || r.urgent === true,
    anonymous: r.anonymous === 1 || r.anonymous === true,
  }
}

app.listen(PORT, () => {
  console.log(`✅ SafeSchool Africa running at http://localhost:${PORT}`)
  console.log(`   Demo accounts:`)
  console.log(`   student@test.com / Test1234!`)
  console.log(`   staff@test.com   / Test1234!`)
  console.log(`   admin@test.com   / Test1234!`)
})