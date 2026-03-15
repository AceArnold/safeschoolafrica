document.addEventListener('DOMContentLoaded', () => {
  // If already logged in redirect straight to their page
  const raw = localStorage.getItem('ssa_session')
  if (raw) {
    const session = JSON.parse(raw)
    if (session.role === 'student') window.location.href = 'student-report.html'
    if (session.role === 'staff')   window.location.href = 'staff-dashboard.html'
    if (session.role === 'admin')   window.location.href = 'analytics.html'
  }

  // Animate stats counting up
  document.querySelectorAll('.stat-number[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target)
    const suffix = el.dataset.suffix || ''
    let current = 0
    const step = Math.ceil(target / 60)
    const timer = setInterval(() => {
      current = Math.min(current + step, target)
      el.textContent = current.toLocaleString() + suffix
      if (current >= target) clearInterval(timer)
    }, 24)
  })

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault()
      const target = document.querySelector(anchor.getAttribute('href'))
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })

  // Fade in sections on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1'
        entry.target.style.transform = 'translateY(0)'
      }
    })
  }, { threshold: 0.1 })

  document.querySelectorAll('.problem-card, .step-card, .role-card').forEach(el => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(20px)'
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease'
    observer.observe(el)
  })
})