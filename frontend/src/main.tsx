import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { enGB } from 'date-fns/locale'
import App from './App'
const theme = createTheme({
  palette: {
    primary: { main: '#286b66', dark: '#19354d' },
    secondary: { main: '#a9e3ce' },
    background: { default: '#f5f7fb', paper: '#ffffff' }
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }
})
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
        <CssBaseline />
        <BrowserRouter><App /></BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  </React.StrictMode>
)
