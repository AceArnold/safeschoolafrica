import { useState } from 'react'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    alert(`Logging in as ${email}`)
  }

  return (
    <div style={{minHeight: '100vh', background: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'}}>
        
        <h1 style={{textAlign: 'center', color: '#1a56db', marginBottom: '0.5rem'}}>🛡️ SafeSchool Africa</h1>
        <p style={{textAlign: 'center', color: '#666', marginBottom: '2rem'}}>Sign in to continue</p>

        <form onSubmit={handleLogin}>
          <div style={{marginBottom: '1rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '600'}}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem'}}
            />
          </div>

          <div style={{marginBottom: '1.5rem'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '600'}}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem'}}
            />
          </div>

          <button
            type="submit"
            style={{width: '100%', padding: '0.75rem', background: '#1a56db', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer'}}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login