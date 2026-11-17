import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

export default function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('slotwise_token')
    const email = localStorage.getItem('slotwise_email')
    const displayName = localStorage.getItem('slotwise_name')
    const role = localStorage.getItem('slotwise_role')
    return token && email && displayName && role ? { token, email, displayName, role } : null
  })
  const navigate = useNavigate()

  const login = (value) => {
    localStorage.setItem('slotwise_token', value.token)
    localStorage.setItem('slotwise_email', value.email)
    localStorage.setItem('slotwise_name', value.displayName)
    localStorage.setItem('slotwise_role', value.role)
    setAuth(value)
    navigate('/')
  }

  const logout = () => {
    for (const key of ['slotwise_token', 'slotwise_email', 'slotwise_name', 'slotwise_role']) localStorage.removeItem(key)
    setAuth(null)
    navigate('/login')
  }

  return <Routes>
    <Route path="/login" element={auth ? <Navigate to="/" replace /> : <Login onLogin={login} />} />
    <Route path="/" element={auth ? <Dashboard auth={auth} onLogout={logout} /> : <Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
