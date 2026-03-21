document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireAuth(['student'])
  if (!session) return

  if (document.getElementById('nav-name'))     document.getElementById('nav-name').textContent     = session.name
  if (document.getElementById('nav-initials')) document.getElementById('nav-initials').textContent = Auth.getInitials(session.name)

  document.getElementById('logout-btn').addEventListener('click', () => Auth.logout())

  // ── State ──
  let selectedCategory = ''
  let isAnonymous = false
  let isUrgent    = false

  // ── Category selection ──
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'))
      btn.classList.add('selected')
      selectedCategory = btn.dataset.category
      updateProgress()
    })
  })

  // ── Anonymous toggle ──
  const anonToggle = document.getElementById('anon-toggle')
  const anonLabel  = document.getElementById('anon-label')
  document.getElementById('anon-field').addEventListener('click', () => {
    isAnonymous = !isAnonymous
    anonToggle.classList.toggle('on', isAnonymous)
    anonLabel.textContent = isAnonymous ? 'Your name will be hidden from staff' : 'Your name will be visible to staff'
  })

  // ── Urgency toggle ──
  const urgentToggle = document.getElementById('urgent-toggle')
  const urgentLabel  = document.getElementById('urgent-label')
  document.getElementById('urgent-field').addEventListener('click', () => {
    isUrgent = !isUrgent
    urgentToggle.classList.toggle('on', isUrgent)
    urgentToggle.classList.toggle('urgency-on', isUrgent)
    urgentLabel.textContent = isUrgent ? 'Marked as urgent — staff will prioritise this' : 'Mark as urgent if you are in immediate danger'
  })

  // ── Character counter ──
  const descTA  = document.getElementById('description')
  const counter = document.getElementById('char-counter')
  const MAX     = 1000

  descTA.addEventListener('input', () => {
    const len = descTA.value.length
    counter.textContent = `${len} / ${MAX}`
    counter.classList.toggle('warn', len > MAX * 0.85)
    updateProgress()
  })

  // ── Progress bar ──
  function updateProgress() {
    const hasCategory = selectedCategory !== ''
    const hasDesc     = descTA.value.trim().length > 20
    const pct         = ([hasCategory, hasDesc].filter(Boolean).length / 2) * 100
    document.getElementById('progress-fill').style.width = pct + '%'
  }

  // ── Form submit ──
  document.getElementById('report-form').addEventListener('submit', async (e) => {
    e.preventDefault()

    if (!selectedCategory) {
      alert('Please select an incident category.')
      return
    }

    const description = descTA.value.trim()
    if (description.length < 20) {
      alert('Please provide more detail — at least 20 characters.')
      return
    }
    if (description.length > MAX) {
      alert(`Description is too long. Maximum ${MAX} characters.`)
      return
    }

    const submitBtn = document.getElementById('submit-btn')
    submitBtn.disabled = true
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting...'

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId:   isAnonymous ? 'anonymous' : session.id,
          studentName: isAnonymous ? 'Anonymous' : session.name,
          category:    selectedCategory,
          description,
          urgent:    isUrgent,
          anonymous: isAnonymous,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed.')

      showSuccess(data.id, isUrgent)
    } catch (err) {
      alert('Error submitting report: ' + err.message)
      submitBtn.disabled = false
      submitBtn.textContent = 'Submit report'
    }
  })

  // ── Success screen ──
  function showSuccess(caseId, urgent) {
    document.getElementById('report-screen').classList.add('hidden')
    const success = document.getElementById('success-screen')
    success.classList.remove('hidden')
    document.getElementById('case-id').textContent = caseId
    if (urgent) {
      document.getElementById('success-msg').textContent =
        'Your report has been marked urgent. A staff member will review it as soon as possible. You are not alone.'
    }
  }

  // ── Another report ──
  document.getElementById('another-btn').addEventListener('click', () => {
    window.location.reload()
  })
})