import { useState } from 'react'
import {
  Alert, Box, Button, CircularProgress, Divider, Stack, TextField, Typography
} from '@mui/material'
import { api, errorMessage } from '../api'
import UiIcon from './UiIcon'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [register, setRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError('')
    if (!email.trim() || !password || (register && !displayName.trim())) {
      setError(register ? 'Add your name, email and password to continue.' : 'Enter your email and password to continue.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post(
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

  return <Box sx={{
    minHeight: '100vh', p: { xs: 1.5, sm: 2.5, lg: 4 }, display: 'grid', placeItems: 'center',
    bgcolor: '#f4f2eb', backgroundImage: 'radial-gradient(#d9d7cd 0.7px, transparent 0.7px)', backgroundSize: '18px 18px'
  }}>
    <Box sx={{
      width: 'min(1160px, 100%)',       minHeight: { xs: 'calc(100vh - 24px)', md: 690 }, display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '1.03fr .97fr' }, borderRadius: { xs: 1, md: 1.5 }, overflow: 'hidden',
      bgcolor: '#fffefa', boxShadow: '0 30px 100px rgba(37,48,38,.14)'
    }}>
      <Box sx={{
        minHeight: { xs: 250, md: 'auto' }, px: { xs: 3, sm: 5, md: 7 }, py: { xs: 3, md: 5 },
        position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        color: '#f8f6ec', background: 'linear-gradient(145deg,#173e2d 0%,#24543f 58%,#416947 100%)'
      }}>
        <Box sx={{ position: 'absolute', width: 430, height: 430, right: -230, bottom: -180, borderRadius: '50%', border: '1px solid rgba(242,246,217,.16)', '&::before': { content: '""', position: 'absolute', inset: 30, borderRadius: '50%', border: '1px solid rgba(242,246,217,.13)' }, '&::after': { content: '""', position: 'absolute', inset: 70, borderRadius: '50%', border: '1px solid rgba(242,246,217,.1)' } }} />
        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ position: 'relative' }}>
          <Box sx={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: '50%', bgcolor: '#d6f278', color: '#203c2e' }}><UiIcon name="room" size={18} /></Box>
          <Typography sx={{ fontWeight: 800, letterSpacing: '-.045em', fontSize: 22 }}>slotwise<span style={{ color: '#d6f278' }}>.</span></Typography>
        </Stack>
        <Box sx={{ maxWidth: 470, position: 'relative', my: { xs: 4, md: 0 } }}>
          <Typography sx={{ color: '#d6f278', fontSize: 11, letterSpacing: 2.2, fontWeight: 800 }}>SPACE FOR THE WAY YOU WORK</Typography>
          <Typography sx={{ mt: 2, maxWidth: 460, fontSize: { xs: 36, sm: 46, lg: 56 }, lineHeight: 1.02, letterSpacing: '-.065em', fontWeight: 700 }}>
            A better place to get things done.
          </Typography>
          <Typography sx={{ mt: 2.5, maxWidth: 390, fontSize: 15, lineHeight: 1.75, color: 'rgba(248,246,236,.68)' }}>
            Find a room, gather your people, and make the time yours. All your shared spaces, in one thoughtful place.
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 4 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'rgba(255,255,255,.16)', display: 'grid', placeItems: 'center' }}><UiIcon name="check" size={17} /></Box>
            <Typography variant="caption" sx={{ color: 'rgba(248,246,236,.65)' }}>Simple scheduling. More time for good work.</Typography>
          </Stack>
        </Box>
        <Typography variant="caption" sx={{ position: 'relative', color: 'rgba(248,246,236,.42)' }}>A little more room for what matters.</Typography>
      </Box>

      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 3, sm: 5, md: 7 } }}>
        <Box sx={{ width: '100%', maxWidth: 390 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: .8, px: 1.5, py: .75, mb: 3.5, borderRadius: 1, bgcolor: '#f0f2e8', color: '#52714a' }}>
            <UiIcon name="sparkle" size={15} /><Typography variant="caption" fontWeight={800} letterSpacing={.3}>YOUR WORKSPACE, REIMAGINED</Typography>
          </Box>
          <Typography sx={{ fontSize: 36, fontWeight: 750, letterSpacing: '-.055em', lineHeight: 1.12, color: '#242a23' }}>
            {register ? 'Join your workspace.' : 'Good to have you back.'}
          </Typography>
          <Typography sx={{ mt: 1.25, mb: 3.5, fontSize: 14, lineHeight: 1.65, color: 'text.secondary' }}>
            {register ? 'Create your account and find your next space.' : 'Sign in to pick up right where you left off.'}
          </Typography>
          <Stack component="form" onSubmit={(event) => { event.preventDefault(); void submit() }} spacing={2}>
            {error && <Alert severity="error" variant="outlined" sx={{ borderRadius: 1, bgcolor: '#fff8f6' }}>{error}</Alert>}
            {register && <TextField autoComplete="name" label="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />}
            <TextField autoComplete="email" label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField autoComplete={register ? 'new-password' : 'current-password'} label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {register && <Typography variant="caption" color="text.secondary">At least 8 characters, including a number.</Typography>}
            <Button type="submit" variant="contained" disabled={loading} endIcon={!loading && <UiIcon name="arrow" size={17} />} sx={{ mt: '8px!important', py: 1.3, bgcolor: '#24543f', '&:hover': { bgcolor: '#163a2b' } }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : register ? 'Create account' : 'Sign in to Slotwise'}
            </Button>
          </Stack>
          <Divider sx={{ my: 3 }} />
          <Button fullWidth onClick={() => { setRegister(!register); setError('') }} sx={{ color: '#52604f', '&:hover': { bgcolor: '#f4f3ec' } }}>
            {register ? 'Already have an account? Sign in' : 'New here? Create an account'}
          </Button>
        </Box>
      </Box>
    </Box>
  </Box>
}
