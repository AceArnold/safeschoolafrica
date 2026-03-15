document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireAuth(['staff', 'admin'])
  if (!session) return

  document.getElementById('nav-name').textContent = session.name
  document.getElementById('logout-btn').addEventListener('click', () => Auth.logout())

  let allReports = []
  let activeFilter = 'all'
  let searchQuery = ''

  function loadReports() {
    allReports = JSON.parse(localStorage.getItem('ssa_reports') || '[]')
    if (allReports.length === 0) {
      allReports = getMockReports()
      localStorage.setItem('ssa_reports', JSON.stringify(allReports))
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

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      activeFilter = btn.dataset.filter
      renderTable()
    })
  })

  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase()
    renderTable()
  })

  function renderTable() {
    let filtered = [...allReports]

    if (activeFilter === 'urgent') filtered = filtered.filter(r => r.urgent)
    else if (activeFilter !== 'all') filtered = filtered.filter(r => r.status === activeFilter)

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.category.toLowerCase().includes(searchQuery) ||
        r.id.toLowerCase().includes(searchQuery) ||
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

  function getMockReports() {
    return [
      { id: 'SSA-001', studentId: '1', studentName: 'Anonymous',           category: 'Cyberbullying',         description: 'Someone in my class created a fake account using my photos and is sending mean messages to other students pretending to be me.', urgent: true,  anonymous: true,  status: 'new',         date: new Date(Date.now() - 86400000).toISOString(),   location: 'Instagram' },
      { id: 'SSA-002', studentId: '2', studentName: 'Brian Mugisha',        category: 'Grooming',              description: 'An adult I met online keeps asking me personal questions and wants to meet in person. I feel uncomfortable.',                   urgent: true,  anonymous: false, status: 'in-progress', date: new Date(Date.now() - 172800000).toISOString(),  location: 'WhatsApp' },
      { id: 'SSA-003', studentId: '3', studentName: 'Claudine Ishimwe',     category: 'Harassment',            description: 'A group of students keep tagging me in embarrassing posts and commenting hurtful things on everything I post.',                  urgent: false, anonymous: false, status: 'in-progress', date: new Date(Date.now() - 259200000).toISOString(),  location: 'TikTok' },
      { id: 'SSA-004', studentId: '4', studentName: 'Anonymous',           category: 'Threats',               description: 'I received a message threatening to share my personal photos if I do not send money.',                                          urgent: true,  anonymous: true,  status: 'escalated',   date: new Date(Date.now() - 345600000).toISOString(),  location: 'Telegram' },
      { id: 'SSA-005', studentId: '5', studentName: 'Emmanuel Nkurunziza', category: 'Inappropriate content', description: 'Someone sent me explicit images through a gaming platform without my consent.',                                                 urgent: false, anonymous: false, status: 'resolved',    date: new Date(Date.now() - 432000000).toISOString(),  location: 'Discord' },
      { id: 'SSA-006', studentId: '6', studentName: 'Fabiola Uwera',       category: 'Cyberbullying',         description: 'A class group chat has been used to make fun of me for weeks. Screenshots have been shared widely.',                             urgent: false, anonymous: false, status: 'new',         date: new Date(Date.now() - 518400000).toISOString(),  location: 'WhatsApp' },
    ]
  }

  loadReports()
})