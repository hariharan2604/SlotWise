import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { api } from './api'

export default function App() {
  const [auth, setAuth] = useState(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    localStorage.removeItem('slotwise_token')
    api.get('/auth/me')
      .then(({ data }) => { if (active) setAuth(data) })
      .catch(() => { if (active) setAuth(null) })
      .finally(() => { if (active) setSessionChecked(true) })
    return () => { active = false }
  }, [])

  const login = (value) => {
    setAuth(value)
    navigate('/')
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Could not clear the server session.', error)
    } finally {
      setAuth(null)
      navigate('/login')
    }
  }

  if (!sessionChecked) return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>

  return <Routes>
    <Route path="/login" element={auth ? <Navigate to="/" replace /> : <Login onLogin={login} />} />
    <Route path="/" element={auth ? <Dashboard auth={auth} onLogout={logout} /> : <Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
