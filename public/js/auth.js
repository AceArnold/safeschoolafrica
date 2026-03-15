const MOCK_USERS = [
  { id: '1', email: 'student@test.com', password: 'Test1234!', role: 'student', name: 'Alice Uwase' },
  { id: '2', email: 'staff@test.com',   password: 'Test1234!', role: 'staff',   name: 'Mr. Kamanzi' },
  { id: '3', email: 'admin@test.com',   password: 'Test1234!', role: 'admin',   name: 'Dr. Murekatete' },
]

const Auth = {
  login(email, password) {
    const user = MOCK_USERS.find(u => u.email === email && u.password === password)
    if (!user) throw new Error('Invalid email or password. Please try again.')
    const session = { id: user.id, email: user.email, role: user.role, name: user.name }
    localStorage.setItem('ssa_session', JSON.stringify(session))
    return session
  },

  logout() {
    localStorage.removeItem('ssa_session')
    window.location.href = '/login.html'
  },

  getSession() {
    const raw = localStorage.getItem('ssa_session')
    return raw ? JSON.parse(raw) : null
  },

  requireAuth(allowedRoles = []) {
    const session = this.getSession()
    if (!session) {
      window.location.href = '/login.html'
      return null
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      this.redirectByRole(session.role)
      return null
    }
    return session
  },

  redirectByRole(role) {
    if (role === 'student') window.location.href = '/student-report.html'
    if (role === 'staff')   window.location.href = '/staff-dashboard.html'
    if (role === 'admin')   window.location.href = '/analytics.html'
  },

  getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
}