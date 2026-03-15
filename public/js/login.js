document.addEventListener('DOMContentLoaded', () => {

  // If already logged in, skip login and go straight to their page
  const session = Auth.getSession()
  if (session) Auth.redirectByRole(session.role)

  const form      = document.getElementById('login-form')
  const emailIn   = document.getElementById('email')
  const passIn    = document.getElementById('password')
  const toggleBtn = document.getElementById('toggle-password')
  const submitBtn = document.getElementById('submit-btn')
  const errorBox  = document.getElementById('error-box')
  const errorMsg  = document.getElementById('error-msg')

  // Show / hide password
  toggleBtn.addEventListener('click', () => {
    const isPassword = passIn.type === 'password'
    passIn.type = isPassword ? 'text' : 'password'
    toggleBtn.textContent = isPassword ? '🙈' : '👁️'
  })

  // Handle form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    errorBox.classList.add('hidden')
    submitBtn.disabled = true
    submitBtn.innerHTML = '<span class="spinner"></span> Signing in...'

    // Small delay for UX feel
    setTimeout(() => {
      try {
        const session = Auth.login(emailIn.value.trim(), passIn.value)
        Auth.redirectByRole(session.role)
      } catch (err) {
        errorMsg.textContent = err.message
        errorBox.classList.remove('hidden')
        submitBtn.disabled = false
        submitBtn.textContent = 'Sign in'
      }
    }, 600)
  })

  // Demo account quick-fill buttons
  document.querySelectorAll('.demo-account-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      emailIn.value = btn.dataset.email
      passIn.value  = btn.dataset.pass
      emailIn.focus()
    })
  })

})