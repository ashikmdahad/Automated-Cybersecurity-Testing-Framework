import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { AppBar, Toolbar, Typography, Container, Grid, Box, IconButton, Snackbar, Alert, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider, ButtonGroup, Button } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import Dashboard from './components/Dashboard';
import ScanComponent from './components/ScanComponent';
import ResultsTable from './components/ResultsTable';
import VulnerabilityChart from './components/VulnerabilityChart';
import History from './components/History';
import SectionCard from './components/SectionCard';
import StatCard from './components/StatCard';
import ReportViewer from './components/ReportViewer';
import makeTheme from './theme';
import ActivityLog from './components/ActivityLog';

function App() {
  const [results, setResults] = React.useState([]);
  const [report, setReport] = React.useState('');
  const [scanning, setScanning] = React.useState(false);
  const [mode, setMode] = React.useState('light');
  const [openDrawer, setOpenDrawer] = React.useState(false);
  const [view, setView] = React.useState('overview');
  const [dense, setDense] = React.useState(true);
  const [toast, setToast] = React.useState({ open: false, severity: 'info', message: '' });
  const [logs, setLogs] = React.useState([]);
  const appendLog = React.useCallback((entry) => setLogs((prev) => [entry, ...prev].slice(0, 50)), []);
  const notify = React.useCallback(({ severity, message }) => setToast({ open: true, severity, message }), []);

  // Aggregate results by type for chart
  const chartData = React.useMemo(() => {
    const counts = results.reduce((acc, r) => {
      const key = r.type || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }, [results]);

  const theme = React.useMemo(() => makeTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" sx={{
        background: (theme) => theme.palette.mode === 'light'
          ? 'linear-gradient(90deg, #0f62fe 0%, #6c5ce7 100%)'
          : 'linear-gradient(90deg, #111827 0%, #1f2937 100%)'
      }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => setOpenDrawer(true)} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>Automated Cybersecurity Testing Framework</Typography>
          <IconButton color="inherit" onClick={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))}>
            {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={openDrawer} onClose={() => setOpenDrawer(false)}>
        <List sx={{ width: 240 }}>
          <ListItemButton onClick={() => { setView('overview'); setOpenDrawer(false); }}>
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Overview" />
          </ListItemButton>
          <ListItemButton onClick={() => { setView('history'); setOpenDrawer(false); }}>
            <ListItemIcon><HistoryIcon /></ListItemIcon>
            <ListItemText primary="History" />
          </ListItemButton>
          <ListItemButton onClick={() => { setView('settings'); setOpenDrawer(false); }}>
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </List>
        <Divider />
      </Drawer>
      <Container maxWidth="lg" sx={{ my: 3 }}>
        {view === 'overview' && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <SectionCard>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid item>
                  <Dashboard scanning={scanning} />
                </Grid>
                <Grid item>
                  <ScanComponent setResults={setResults} setReport={setReport} onScanningChange={setScanning} notify={notify} appendLog={appendLog} />
                </Grid>
              </Grid>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard label="Total Events" value={results.length} color="primary.main" />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard label="Detected" value={results.filter(r => (r.status||'').toLowerCase()==='detected').length} color="warning.main" />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard label="Success" value={results.filter(r => (r.status||'').toLowerCase()==='success').length} color="success.main" />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard label="Failed" value={results.filter(r => (r.status||'').toLowerCase()==='failed').length} color="error.main" />
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionCard>
              <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6">Results</Typography>
                <ButtonGroup size="small" variant="outlined">
                  <Button onClick={() => setDense((d) => !d)}>{dense ? 'Comfortable' : 'Compact'}</Button>
                  <Button onClick={() => import('./utils/export').then(m => m.exportToCSV('results.csv', results))}>Export CSV</Button>
                  <Button onClick={() => import('./utils/export').then(m => m.exportToJSON('results.json', results))}>Export JSON</Button>
                </ButtonGroup>
              </Grid>
              <ResultsTable results={results} dense={dense} />
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionCard>
              <Typography variant="h6" sx={{ mb: 1 }}>Vulnerabilities</Typography>
              <VulnerabilityChart data={chartData} />
            </SectionCard>
          </Grid>
          <Grid item xs={12}>
            <SectionCard>
              <Typography variant="h6" sx={{ mb: 1 }}>Report</Typography>
              <ReportViewer markdown={report} />
            </SectionCard>
          </Grid>
          <Grid item xs={12}>
            <ActivityLog logs={logs} />
          </Grid>
        </Grid>
        )}
        {view === 'history' && (
          <History />
        )}
        {view === 'settings' && (
          <SectionCard>
            <Typography variant="h6" sx={{ mb: 1 }}>Settings</Typography>
            <Grid container spacing={2}>
              <Grid item>
                <Typography variant="body2">Table density</Typography>
                <ButtonGroup size="small" variant="outlined">
                  <Button onClick={() => setDense(true)} disabled={dense}>Compact</Button>
                  <Button onClick={() => setDense(false)} disabled={!dense}>Comfortable</Button>
                </ButtonGroup>
              </Grid>
            </Grid>
          </SectionCard>
        )}
      </Container>
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
