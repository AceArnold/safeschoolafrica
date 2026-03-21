document.addEventListener('DOMContentLoaded', async () => {
  const session = Auth.requireAuth(['admin', 'staff'])
  if (!session) return

  document.getElementById('nav-name').textContent = session.name
  document.getElementById('logout-btn').addEventListener('click', () => Auth.logout())

  // ── Load analytics from API ──
  let data
  try {
    const res = await fetch('/api/analytics')
    data = await res.json()
  } catch (err) {
    console.error('Failed to load analytics:', err)
    return
  }

  const { total, resolved, urgent, resRate, categories, catCounts, statusCounts, monthly } = data

  document.getElementById('stat-total').textContent    = total
  document.getElementById('stat-resolved').textContent = resolved
  document.getElementById('stat-urgent').textContent   = urgent
  document.getElementById('stat-rate').textContent     = resRate + '%'

  const months       = monthly.map(m => m.label)
  const monthlyCounts = monthly.map(m => m.count)

  const statusLabels = ['New', 'In Progress', 'Escalated', 'Resolved']
  const statusValues = [statusCounts.new, statusCounts.inProgress, statusCounts.escalated, statusCounts.resolved]

  // ── Chart defaults ──
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif"
  Chart.defaults.font.size   = 12
  Chart.defaults.color       = '#78716c'

  const RED    = '#991b1b'
  const RED_BG = 'rgba(153,27,27,0.08)'

  // ── Bar chart — by category ──
  new Chart(document.getElementById('cat-chart'), {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [{
        label: 'Incidents',
        data: catCounts,
        backgroundColor: RED_BG,
        borderColor: RED,
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f5f5f4' } },
        x: { grid: { display: false } }
      }
    }
  })

  // ── Line chart — monthly trend ──
  new Chart(document.getElementById('trend-chart'), {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Reports',
        data: monthlyCounts,
        borderColor: RED,
        backgroundColor: RED_BG,
        borderWidth: 2.5,
        pointBackgroundColor: RED,
        pointRadius: 4,
        fill: true,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f5f5f4' } },
        x: { grid: { display: false } }
      }
    }
  })

  // ── Doughnut — status breakdown ──
  new Chart(document.getElementById('status-chart'), {
    type: 'doughnut',
    data: {
      labels: statusLabels,
      datasets: [{
        data: statusValues,
        backgroundColor: ['#e5e7eb', '#fef08a', '#fecaca', '#bbf7d0'],
        borderColor:     ['#d1d5db', '#eab308', '#991b1b', '#15803d'],
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8 }
        }
      },
      cutout: '65%',
    }
  })

  // ── Breakdown table ──
  const maxCount = Math.max(...catCounts, 1)
  const tbody = document.getElementById('breakdown-tbody')
  tbody.innerHTML = categories.map((cat, i) => `
    <tr>
      <td style="width:140px; font-weight:600; color:var(--text-dark);">${cat}</td>
      <td>
        <div class="breakdown-bar-wrap">
          <div class="breakdown-bar" style="width:${Math.round((catCounts[i] / maxCount) * 100)}%"></div>
        </div>
      </td>
      <td style="width:40px; text-align:right; font-weight:700; color:var(--text-dark);">${catCounts[i]}</td>
    </tr>
  `).join('')

  // ── Export PDF ──
  document.getElementById('export-btn').addEventListener('click', () => {
    window.print()
  })
})