const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, 'safeschool.db')

let db = null

async function getDb() {
  if (db) return db

  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
    createTables()
    seedData()
    saveDb()
  }

  return db
}

function saveDb() {
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      studentName TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT,
      urgent INTEGER DEFAULT 0,
      anonymous INTEGER DEFAULT 0,
      status TEXT DEFAULT 'new',
      date TEXT NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reportId TEXT NOT NULL,
      text TEXT NOT NULL,
      by TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT DEFAULT 'action',
      FOREIGN KEY (reportId) REFERENCES reports(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS checklists (
      reportId TEXT PRIMARY KEY,
      state TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (reportId) REFERENCES reports(id)
    )
  `)
}

function seedData() {
  // Seed users
  const users = [
    { id: '1', email: 'student@test.com', password: 'Test1234!', role: 'student', name: 'Alice Uwase' },
    { id: '2', email: 'staff@test.com',   password: 'Test1234!', role: 'staff',   name: 'Mr. Kamanzi' },
    { id: '3', email: 'admin@test.com',   password: 'Test1234!', role: 'admin',   name: 'Dr. Murekatete' },
  ]

  const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, email, password, role, name) VALUES (?, ?, ?, ?, ?)')
  users.forEach(u => insertUser.run([u.id, u.email, u.password, u.role, u.name]))
  insertUser.free()

  // Seed mock reports
  const now = Date.now()
  const reports = [
    { id: 'SSA-001', studentId: 'anon', studentName: 'Anonymous',           category: 'Cyberbullying',         description: 'Someone in my class created a fake account using my photos and is sending mean messages to other students pretending to be me.', location: 'Instagram', urgent: 1, anonymous: 1, status: 'new',         date: new Date(now - 86400000).toISOString() },
    { id: 'SSA-002', studentId: '1',    studentName: 'Brian Mugisha',        category: 'Grooming',              description: 'An adult I met online keeps asking me personal questions and wants to meet in person. I feel uncomfortable.',                   location: 'WhatsApp', urgent: 1, anonymous: 0, status: 'in-progress', date: new Date(now - 172800000).toISOString() },
    { id: 'SSA-003', studentId: '1',    studentName: 'Claudine Ishimwe',     category: 'Harassment',            description: 'A group of students keep tagging me in embarrassing posts and commenting hurtful things on everything I post.',                  location: 'TikTok',   urgent: 0, anonymous: 0, status: 'in-progress', date: new Date(now - 259200000).toISOString() },
    { id: 'SSA-004', studentId: 'anon', studentName: 'Anonymous',           category: 'Threats',               description: 'I received a message threatening to share my personal photos if I do not send money.',                                          location: 'Telegram', urgent: 1, anonymous: 1, status: 'escalated',   date: new Date(now - 345600000).toISOString() },
    { id: 'SSA-005', studentId: '1',    studentName: 'Emmanuel Nkurunziza', category: 'Inappropriate content', description: 'Someone sent me explicit images through a gaming platform without my consent.',                                                 location: 'Discord',  urgent: 0, anonymous: 0, status: 'resolved',    date: new Date(now - 432000000).toISOString() },
    { id: 'SSA-006', studentId: '1',    studentName: 'Fabiola Uwera',       category: 'Cyberbullying',         description: 'A class group chat has been used to make fun of me for weeks. Screenshots have been shared widely.',                             location: 'WhatsApp', urgent: 0, anonymous: 0, status: 'new',         date: new Date(now - 518400000).toISOString() },
  ]

  const insertReport = db.prepare('INSERT OR IGNORE INTO reports (id, studentId, studentName, category, description, location, urgent, anonymous, status, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  reports.forEach(r => insertReport.run([r.id, r.studentId, r.studentName, r.category, r.description, r.location, r.urgent, r.anonymous, r.status, r.date]))
  insertReport.free()

  // Seed audit logs for each report
  reports.forEach(r => {
    db.run('INSERT INTO audit_logs (reportId, text, by, date, type) VALUES (?, ?, ?, ?, ?)',
      [r.id, 'Case created — report submitted', r.studentName, r.date, 'create'])
    db.run('INSERT OR IGNORE INTO checklists (reportId, state) VALUES (?, ?)', [r.id, '{}'])
  })
}

module.exports = { getDb, saveDb }