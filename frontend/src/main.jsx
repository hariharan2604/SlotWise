import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { enGB } from 'date-fns/locale'
import 'leaflet/dist/leaflet.css'
import './officeLocations.css'
import App from './App'
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#24543f', dark: '#163a2b', light: '#e6eee8' },
    secondary: { main: '#d6f278', contrastText: '#1e392c' },
    background: { default: '#f4f2eb', paper: '#fffefa' },
    text: { primary: '#232921', secondary: '#77796f' },
    divider: '#e9e7de',
    error: { main: '#c34f43' },
    success: { main: '#397857' }
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'Inter, "Avenir Next", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: { fontWeight: 750, letterSpacing: '-0.045em' },
    h5: { fontWeight: 750, letterSpacing: '-0.035em' },
    h6: { fontWeight: 700, letterSpacing: '-0.025em' },
    button: { textTransform: 'none', fontWeight: 700 }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': { boxSizing: 'border-box' },
        html: { backgroundColor: '#f4f2eb' },
        body: { margin: 0, minWidth: 320, WebkitFontSmoothing: 'antialiased', textRendering: 'optimizeLegibility' },
        '::selection': { backgroundColor: '#d6f278', color: '#1e392c' },
        '*::-webkit-scrollbar': { width: 8, height: 8 },
        '*::-webkit-scrollbar-thumb': { backgroundColor: '#d1d1c6', borderRadius: 8 },
        '*::-webkit-scrollbar-track': { backgroundColor: 'transparent' }
      }
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 6, minHeight: 42, paddingInline: 18 },
        containedPrimary: { boxShadow: '0 8px 18px rgba(36,84,63,.15)' }
      }
    },
    MuiCard: {
      styleOverrides: { root: { boxShadow: '0 8px 28px rgba(39,44,35,.045)' } }
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { borderRadius: 6, backgroundColor: '#fffefa' }
        }
      }
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 700, borderRadius: 4 } }
    }
  }
})
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
        <CssBaseline />
        <BrowserRouter><App /></BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  </React.StrictMode>
)
