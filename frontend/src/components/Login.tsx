import { useState } from 'react'
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Divider, Stack, TextField, Typography
} from '@mui/material'
import { api, errorMessage } from '../api'
import type { AuthResponse } from '../types'

export default function Login({ onLogin }: { onLogin: (auth: AuthResponse) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [register, setRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<AuthResponse>(
        register ? '/auth/register' : '/auth/login',
        register ? { displayName: displayName.trim(), email: email.trim(), password } : { email: email.trim(), password }
      )
      onLogin(data)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'grid', gridTemplateColumns: { md: '1fr 1fr' },
      bgcolor: '#f5f7fb'
    }}>
      <Box sx={{
        display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between',
        p: { md: 7, lg: 10 }, color: 'white',
        background: 'linear-gradient(145deg, #142945 0%, #235c73 58%, #3b8c83 100%)'
      }}>
        <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>slotwise<span style={{ color: '#91e0c3' }}>.</span></Typography>
        <Box sx={{ maxWidth: 520 }}>
          <Typography variant="overline" sx={{ color: '#a8e8d1', letterSpacing: 2 }}>A calmer way to share space</Typography>
          <Typography variant="h2" fontWeight={750} letterSpacing={-2} lineHeight={1.08} sx={{ my: 2 }}>
            Make room for great work.
          </Typography>
          <Typography variant="h6" fontWeight={400} sx={{ color: 'rgba(255,255,255,.75)', lineHeight: 1.6 }}>
            Find a space, check the time, and book the resources your team needs.
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.55)' }}>Workspace resource booking</Typography>
      </Box>
      <Box sx={{ display: 'grid', placeItems: 'center', p: 3 }}>
        <Card elevation={0} sx={{ width: '100%', maxWidth: 440, border: '1px solid #e6eaf0', borderRadius: 4 }}>
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            <Stack component="form" onSubmit={event => { event.preventDefault(); void submit() }} spacing={2.5}>
              <Box>
                <Typography variant="h4" fontWeight={750} letterSpacing={-1}>{register ? 'Create your account' : 'Welcome back'}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {register ? 'Join your workspace to reserve shared resources.' : 'Sign in to find and book your workspace.'}
                </Typography>
              </Box>
              {error && <Alert severity="error">{error}</Alert>}
              {register && <TextField autoComplete="name" label="Full name" value={displayName} onChange={e => setDisplayName(e.target.value)} required />}
              <TextField autoComplete="email" label="Work email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              <TextField autoComplete={register ? 'new-password' : 'current-password'} label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              {register && <Typography variant="caption" color="text.secondary">Use at least 8 characters and include a number.</Typography>}
              <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ py: 1.3, borderRadius: 2 }}>
                {loading ? <CircularProgress size={23} color="inherit" /> : register ? 'Create account' : 'Sign in'}
              </Button>
              <Divider />
              <Button color="inherit" onClick={() => { setRegister(!register); setError('') }}>
                {register ? 'Already have an account? Sign in' : 'New to SlotWise? Create an account'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
