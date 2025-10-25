import React from 'react';
import axios from 'axios';
import { Stack, TextField, Button, Typography, Paper } from '@mui/material';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

function parseList(str) {
  return str
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function formatList(arr) {
  if (!arr) return '';
  return arr.join(', ');
}

function SettingsPanel({ notify }) {
  const [loading, setLoading] = React.useState(false);
  const [whitelist, setWhitelist] = React.useState('0x123, 0x456');
  const [blacklist, setBlacklist] = React.useState('0x7DF, 0x6F1');
  const [rate, setRate] = React.useState(50);

  const load = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/settings`);
      setWhitelist(formatList(res.data.whitelist));
      setBlacklist(formatList(res.data.blacklist));
      setRate(res.data.rate_threshold || 50);
    } catch (e) {
      // noop
    }
  };

  const save = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/api/settings`, {
        whitelist: parseList(whitelist),
        blacklist: parseList(blacklist),
        rate_threshold: Number(rate)
      });
      notify?.({ severity: 'success', message: 'Settings saved' });
    } catch (e) {
      notify?.({ severity: 'error', message: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Detection Settings</Typography>
      <Stack spacing={2}>
        <TextField label="Whitelist (comma-separated)" value={whitelist} onChange={e => setWhitelist(e.target.value)} fullWidth />
        <TextField label="Blacklist (comma-separated)" value={blacklist} onChange={e => setBlacklist(e.target.value)} fullWidth />
        <TextField label="Rate Threshold" type="number" value={rate} onChange={e => setRate(e.target.value)} sx={{ maxWidth: 240 }} />
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={load}>Reload</Button>
          <Button variant="contained" onClick={save} disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default SettingsPanel;

