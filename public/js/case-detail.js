document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireAuth(['staff', 'admin'])
  if (!session) return

  document.getElementById('nav-name').textContent = session.name
  document.getElementById('logout-btn').addEventListener('click', () => Auth.logout())

  // ── Get case ID from URL ──
  const params   = new URLSearchParams(window.location.search)
  const caseId   = params.get('id')
  const reports  = JSON.parse(localStorage.getItem('ssa_reports') || '[]')
  const report   = reports.find(r => r.id === caseId)

  const mainEl     = document.getElementById('case-main')
  const notFoundEl = document.getElementById('not-found')

  if (!report) {
    mainEl.classList.add('hidden')
    notFoundEl.classList.remove('hidden')
    return
  }

  // ── Render case header ──
  document.getElementById('case-id-title').textContent   = 'Case ' + report.id
  document.getElementById('case-category').textContent   = report.category
  document.getElementById('case-date').textContent       = formatDate(report.date)
  document.getElementById('case-student').textContent    = report.studentName
  document.getElementById('case-description').textContent = report.description
  document.getElementById('case-location').textContent   = report.location || 'Not specified'
  document.getElementById('case-anon').textContent       = report.anonymous ? 'Anonymous' : 'Named'
  document.getElementById('case-platform').textContent   = report.location || 'Not specified'

  const statusBadge = document.getElementById('case-status-badge')
  statusBadge.textContent = statusLabel(report.status)
  statusBadge.className   = 'badge ' + badgeClass(report.status)

  document.getElementById('status-select').value = report.status || 'new'

  if (report.urgent) {
    document.getElementById('urgent-flag').classList.remove('hidden')
  }

  // ── Checklist ──
  const checklistKey = 'ssa_checklist_' + caseId
  let checkState = JSON.parse(localStorage.getItem(checklistKey) || '{}')

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

  function renderChecklist() {
    const ul       = document.getElementById('checklist')
    const checked  = checkItems.filter((_, i) => checkState[i]).length
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
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.index)
        checkState[idx] = !checkState[idx]
        localStorage.setItem(checklistKey, JSON.stringify(checkState))
        addAuditEntry(checkState[idx]
          ? `Checklist: "${checkItems[idx]}" marked complete`
          : `Checklist: "${checkItems[idx]}" unchecked`,
          session.name
        )
        renderChecklist()
        renderAudit()
      })
    })
  }

  renderChecklist()

  // ── Audit trail ──
  const auditKey = 'ssa_audit_' + caseId
  let auditLog   = JSON.parse(localStorage.getItem(auditKey) || '[]')

  if (auditLog.length === 0) {
    auditLog = [{ text: 'Case created — report submitted', by: report.studentName, date: report.date, type: 'create' }]
    localStorage.setItem(auditKey, JSON.stringify(auditLog))
  }

  function renderAudit() {
    auditLog = JSON.parse(localStorage.getItem(auditKey) || '[]')
    const el = document.getElementById('audit-trail')
    el.innerHTML = [...auditLog].reverse().map(entry => `
      <div class="audit-item">
        <div class="audit-dot ${entry.type === 'create' ? 'audit-dot-gray' : ''}"></div>
        <div class="audit-content">
          <p>${entry.text}</p>
          <span>${entry.by} · ${formatDate(entry.date)}</span>
        </div>
      </div>
    `).join('')
  }

  function addAuditEntry(text, by) {
    auditLog = JSON.parse(localStorage.getItem(auditKey) || '[]')
    auditLog.push({ text, by, date: new Date().toISOString(), type: 'action' })
    localStorage.setItem(auditKey, JSON.stringify(auditLog))
  }

  renderAudit()

  // ── Update status ──
  document.getElementById('update-btn').addEventListener('click', () => {
    const newStatus = document.getElementById('status-select').value
    const note      = document.getElementById('staff-note').value.trim()

    const idx = reports.findIndex(r => r.id === caseId)
    if (idx !== -1) {
      const oldStatus = reports[idx].status
      reports[idx].status = newStatus
      localStorage.setItem('ssa_reports', JSON.stringify(reports))

      if (oldStatus !== newStatus) {
        addAuditEntry(`Status changed from "${statusLabel(oldStatus)}" to "${statusLabel(newStatus)}"`, session.name)
      }
      if (note) {
        addAuditEntry(`Note: ${note}`, session.name)
        document.getElementById('staff-note').value = ''
      }

      statusBadge.textContent = statusLabel(newStatus)
      statusBadge.className   = 'badge ' + badgeClass(newStatus)
      renderAudit()

      const btn = document.getElementById('update-btn')
      btn.textContent = 'Saved!'
      btn.style.background = 'var(--green)'
      setTimeout(() => {
        btn.textContent = 'Save changes'
        btn.style.background = ''
      }, 1500)
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
})