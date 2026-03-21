document.addEventListener('DOMContentLoaded', async () => {
  const session = Auth.requireAuth(['staff', 'admin'])
  if (!session) return

  document.getElementById('nav-name').textContent = session.name
  document.getElementById('logout-btn').addEventListener('click', () => Auth.logout())

  const params     = new URLSearchParams(window.location.search)
  const caseId     = params.get('id')
  const mainEl     = document.getElementById('case-main')
  const notFoundEl = document.getElementById('not-found')

  // ── Load report from API ──
  let report
  try {
    const res = await fetch(`/api/reports/${caseId}`)
    if (!res.ok) throw new Error('Not found')
    report = await res.json()
  } catch {
    mainEl.classList.add('hidden')
    notFoundEl.classList.remove('hidden')
    return
  }

  // ── Render case header ──
  document.getElementById('case-id-title').textContent    = 'Case ' + report.id
  document.getElementById('case-category').textContent    = report.category
  document.getElementById('case-date').textContent        = formatDate(report.date)
  document.getElementById('case-student').textContent     = report.studentName
  document.getElementById('case-description').textContent = report.description
  document.getElementById('case-location').textContent    = report.location || 'Not specified'
  document.getElementById('case-anon').textContent        = report.anonymous ? 'Anonymous' : 'Named'
  document.getElementById('case-platform').textContent    = report.location || 'Not specified'

  const statusBadge = document.getElementById('case-status-badge')
  statusBadge.textContent = statusLabel(report.status)
  statusBadge.className   = 'badge ' + badgeClass(report.status)
  document.getElementById('status-select').value = report.status || 'new'

  if (report.urgent) document.getElementById('urgent-flag').classList.remove('hidden')

  // ── Checklist ──
  const checkItems = [
    'Acknowledge receipt of report',
    'Review full incident description',
    'Assess level of risk to student',
    'Contact student if not anonymous',
    'Inform designated safeguarding lead',
    'Document all actions taken',
    'Liaise with external agencies if required',
    'Follow up with student after resolution',
    'Close case and update records',
  ]

  let checkState = {}

  async function loadChecklist() {
    try {
      const res = await fetch(`/api/reports/${caseId}/checklist`)
      checkState = await res.json()
    } catch { checkState = {} }
    renderChecklist()
  }

  async function saveChecklist() {
    await fetch(`/api/reports/${caseId}/checklist`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: checkState })
    })
  }

  function renderChecklist() {
    const ul      = document.getElementById('checklist')
    const checked = checkItems.filter((_, i) => checkState[i]).length
    document.getElementById('checklist-progress').textContent = `${checked} / ${checkItems.length}`

    ul.innerHTML = checkItems.map((item, i) => `
      <div class="checklist-item ${checkState[i] ? 'checked' : ''}" data-index="${i}">
        <div class="check-box">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="check-label">${item}</span>
      </div>
    `).join('')

    ul.querySelectorAll('.checklist-item').forEach(item => {
      item.addEventListener('click', async () => {
        const idx = parseInt(item.dataset.index)
        checkState[idx] = !checkState[idx]
        await saveChecklist()
        await addAuditEntry(
          checkState[idx]
            ? `Checklist: "${checkItems[idx]}" marked complete`
            : `Checklist: "${checkItems[idx]}" unchecked`,
          session.name
        )
        renderChecklist()
        loadAudit()
      })
    })
  }

  // ── Audit trail ──
  async function loadAudit() {
    try {
      const res  = await fetch(`/api/reports/${caseId}/audit`)
      const logs = await res.json()
      const el   = document.getElementById('audit-trail')
      el.innerHTML = [...logs].reverse().map(entry => `
        <div class="audit-item">
          <div class="audit-dot ${entry.type === 'create' ? 'audit-dot-gray' : ''}"></div>
          <div class="audit-content">
            <p>${entry.text}</p>
            <span>${entry.by} · ${formatDate(entry.date)}</span>
          </div>
        </div>
      `).join('')
    } catch (err) {
      console.error('Failed to load audit trail:', err)
    }
  }

  async function addAuditEntry(text, by, type = 'action') {
    await fetch(`/api/reports/${caseId}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, by, type })
    })
  }

  // ── Update status ──
  document.getElementById('update-btn').addEventListener('click', async () => {
    const newStatus = document.getElementById('status-select').value
    const note      = document.getElementById('staff-note').value.trim()

    try {
      await fetch(`/api/reports/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note, updatedBy: session.name })
      })

      statusBadge.textContent = statusLabel(newStatus)
      statusBadge.className   = 'badge ' + badgeClass(newStatus)
      document.getElementById('staff-note').value = ''
      loadAudit()

      const btn = document.getElementById('update-btn')
      btn.textContent = 'Saved!'
      btn.style.background = 'var(--green)'
      setTimeout(() => {
        btn.textContent = 'Save changes'
        btn.style.background = ''
      }, 1500)
    } catch (err) {
      alert('Failed to save: ' + err.message)
    }
  })

  // ── Helpers ──
  function badgeClass(status) {
    if (status === 'new')         return 'badge-new'
    if (status === 'in-progress') return 'badge-progress'
    if (status === 'resolved')    return 'badge-resolved'
    if (status === 'escalated')   return 'badge-urgent'
    return 'badge-new'
  }

  function statusLabel(status) {
    if (status === 'new')         return 'New'
    if (status === 'in-progress') return 'In Progress'
    if (status === 'resolved')    return 'Resolved'
    if (status === 'escalated')   return 'Escalated'
    return 'New'
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // ── Init ──
  loadChecklist()
  loadAudit()
})