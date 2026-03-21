document.addEventListener('DOMContentLoaded', async () => {
  const session = Auth.requireAuth(['staff', 'admin'])
  if (!session) return

  document.getElementById('nav-name').textContent = session.name
  document.getElementById('logout-btn').addEventListener('click', () => Auth.logout())

  let allReports  = []
  let activeFilter = 'all'
  let searchQuery  = ''

  // ── Load reports from API ──
  async function loadReports() {
    try {
      const res = await fetch('/api/reports')
      allReports = await res.json()
    } catch (err) {
      console.error('Failed to load reports:', err)
      allReports = []
    }
    renderStats()
    renderTable()
  }

  function renderStats() {
    const total    = allReports.length
    const urgent   = allReports.filter(r => r.urgent).length
    const progress = allReports.filter(r => r.status === 'in-progress').length
    const resolved = allReports.filter(r => r.status === 'resolved').length
    document.getElementById('stat-total').textContent    = total
    document.getElementById('stat-urgent').textContent   = urgent
    document.getElementById('stat-progress').textContent = progress
    document.getElementById('stat-resolved').textContent = resolved
  }

  // ── Filters ──
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      activeFilter = btn.dataset.filter
      renderTable()
    })
  })

  // ── Search ──
  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase()
    renderTable()
  })

  function renderTable() {
    let filtered = [...allReports]

    if (activeFilter === 'urgent')       filtered = filtered.filter(r => r.urgent)
    else if (activeFilter !== 'all')     filtered = filtered.filter(r => r.status === activeFilter)

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.category.toLowerCase().includes(searchQuery)    ||
        r.id.toLowerCase().includes(searchQuery)          ||
        r.studentName.toLowerCase().includes(searchQuery) ||
        r.description.toLowerCase().includes(searchQuery)
      )
    }

    filtered.sort((a, b) => {
      if (a.urgent && !b.urgent) return -1
      if (!a.urgent && b.urgent) return 1
      return new Date(b.date) - new Date(a.date)
    })

    const tbody = document.getElementById('cases-tbody')
    const empty = document.getElementById('empty-state')

    if (filtered.length === 0) {
      tbody.innerHTML = ''
      empty.classList.remove('hidden')
      return
    }

    empty.classList.add('hidden')
    tbody.innerHTML = filtered.map(r => `
      <tr data-id="${r.id}">
        <td class="case-id-cell">
          ${r.urgent ? '<span class="urgent-dot"></span>' : ''}
          ${r.id}
        </td>
        <td>${r.category}</td>
        <td>${r.studentName}</td>
        <td>${formatDate(r.date)}</td>
        <td><span class="badge ${badgeClass(r.status)}">${statusLabel(r.status)}</span></td>
      </tr>
    `).join('')

    tbody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', () => {
        window.location.href = 'case-detail.html?id=' + row.dataset.id
      })
    })
  }

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
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  loadReports()
})