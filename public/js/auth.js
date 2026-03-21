const API = '/api'

const Auth = {
  async login(email, password) {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Invalid email or password. Please try again.')
    localStorage.setItem('ssa_session', JSON.stringify(data))
    return data
  },

  logout() {
    localStorage.removeItem('ssa_session')
    window.location.href = 'login.html'
  },

  getSession() {
    const raw = localStorage.getItem('ssa_session')
    return raw ? JSON.parse(raw) : null
  },

  requireAuth(allowedRoles = []) {
    const session = this.getSession()
    if (!session) {
      window.location.href = 'login.html'
      return null
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      this.redirectByRole(session.role)
      return null
    }
    return session
  },

  redirectByRole(role) {
    if (role === 'student') window.location.href = 'student-report.html'
    if (role === 'staff')   window.location.href = 'staff-dashboard.html'
    if (role === 'admin')   window.location.href = 'analytics.html'
  },

  getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
}