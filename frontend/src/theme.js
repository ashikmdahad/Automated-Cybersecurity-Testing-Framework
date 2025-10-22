import { createTheme } from '@mui/material/styles';

export default function makeTheme(mode = 'light') {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#0f62fe' },
      secondary: { main: '#6c5ce7' },
      success: { main: '#2e7d32' },
      warning: { main: '#ed6c02' },
      background: {
        default: mode === 'light' ? '#f7f9fc' : '#0b1220',
        paper: mode === 'light' ? '#ffffff' : '#0f172a',
      },
      divider: mode === 'light' ? '#e6eaf0' : '#1f2937',
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: ['Roboto', 'Inter', 'Segoe UI', 'Arial', 'sans-serif'].join(','),
      h6: { fontWeight: 600 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', borderRadius: 10, fontWeight: 600 },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: { backgroundColor: mode === 'light' ? '#f1f5f9' : '#111827' },
        },
      },
    },
  });
}

