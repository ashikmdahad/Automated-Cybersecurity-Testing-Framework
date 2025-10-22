import React from 'react';
import axios from 'axios';
import { Button, FormControlLabel, Switch, Stack } from '@mui/material';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

function ScanComponent({ setResults, setReport, onScanningChange, notify, appendLog }) {
  const [loading, setLoading] = React.useState(false);
  const [simulate, setSimulate] = React.useState(true);

  const runScan = async () => {
    setLoading(true);
    onScanningChange?.(true);
    try {
      const response = await axios.post(`${API_BASE}/api/scan`, { interface: 'vcan0', simulate });
      setResults(response.data.results);
      const reportResponse = await axios.get(`${API_BASE}/api/report`);
      setReport(reportResponse.data.report);
      notify?.({ severity: 'success', message: 'Scan completed' });
      appendLog?.({ t: Date.now(), level: 'success', msg: `Scan completed (simulate=${simulate})` });
    } catch (error) {
      console.error('Scan failed', error);
      setReport(`# Error\n\nScan failed: ${error?.message || 'Unknown error'}`);
      notify?.({ severity: 'error', message: 'Scan failed' });
      appendLog?.({ t: Date.now(), level: 'error', msg: `Scan failed: ${error?.message || 'Unknown error'}` });
    } finally {
      setLoading(false);
      onScanningChange?.(false);
    }
  };

  const runLiveScan = () => {
    setLoading(true);
    onScanningChange?.(true);
    try {
      const url = `${API_BASE}/api/scan/stream?interface=vcan0&simulate=${simulate ? 1 : 0}`;
      const es = new EventSource(url);
      const handleMessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.event === 'result' && msg.payload) {
            setResults((prev) => [...prev, msg.payload]);
            appendLog?.({ t: Date.now(), level: (msg.payload.status || 'info'), msg: `Result: ${msg.payload.type} (${msg.payload.status || ''})` });
          } else if (msg.event === 'error') {
            console.error('Stream error', msg.payload);
            notify?.({ severity: 'error', message: 'Live scan error' });
            appendLog?.({ t: Date.now(), level: 'error', msg: `Error: ${msg.payload?.error || 'unknown'}` });
          } else if (msg.event === 'done') {
            es.close();
            axios.get(`${API_BASE}/api/report`).then((r) => setReport(r.data.report)).catch(() => {});
            setLoading(false);
            onScanningChange?.(false);
            notify?.({ severity: 'success', message: 'Live scan finished' });
            appendLog?.({ t: Date.now(), level: 'success', msg: 'Live scan finished' });
          }
        } catch (e) {
          console.error('Failed to parse SSE', e);
        }
      };
      es.onmessage = handleMessage;
      es.onerror = () => {
        es.close();
        setLoading(false);
        onScanningChange?.(false);
        notify?.({ severity: 'error', message: 'Live scan connection error' });
      };
      // Cleanup if component unmounts during stream
      return () => es.close();
    } catch (e) {
      console.error('Failed to start live scan', e);
      setLoading(false);
      onScanningChange?.(false);
      notify?.({ severity: 'error', message: 'Failed to start live scan' });
    }
  };

  const runLiveScanWS = () => {
    setLoading(true);
    onScanningChange?.(true);
    try {
      const url = `${API_BASE.replace('http', 'ws')}/api/scan/ws?interface=vcan0&simulate=${simulate ? 1 : 0}`;
      const ws = new WebSocket(url);
      ws.onopen = () => {
        appendLog?.({ t: Date.now(), level: 'info', msg: 'WebSocket connected' });
      };
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.event === 'result' && msg.payload) {
            setResults((prev) => [...prev, msg.payload]);
            appendLog?.({ t: Date.now(), level: (msg.payload.status || 'info'), msg: `WS Result: ${msg.payload.type} (${msg.payload.status || ''})` });
          } else if (msg.event === 'done') {
            ws.close();
            axios.get(`${API_BASE}/api/report`).then((r) => setReport(r.data.report)).catch(() => {});
            setLoading(false);
            onScanningChange?.(false);
            notify?.({ severity: 'success', message: 'WebSocket scan finished' });
          } else if (msg.event === 'error') {
            notify?.({ severity: 'error', message: 'WebSocket scan error' });
          }
        } catch (e) {
          console.error('WS parse error', e);
        }
      };
      ws.onerror = () => {
        setLoading(false);
        onScanningChange?.(false);
        notify?.({ severity: 'error', message: 'WebSocket error' });
      };
      ws.onclose = () => {
        appendLog?.({ t: Date.now(), level: 'info', msg: 'WebSocket closed' });
      };
      return () => ws.close();
    } catch (e) {
      setLoading(false);
      onScanningChange?.(false);
      notify?.({ severity: 'error', message: 'Failed to start WebSocket scan' });
    }
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Button variant="contained" onClick={runScan} disabled={loading}>{loading ? 'Scanning…' : 'Run Scan'}</Button>
      <Button variant="outlined" onClick={runLiveScan} disabled={loading}>Live Scan</Button>
      <Button variant="outlined" onClick={runLiveScanWS} disabled={loading}>Live Scan (WS)</Button>
      <FormControlLabel control={<Switch checked={simulate} onChange={e => setSimulate(e.target.checked)} />} label="Simulate" />
    </Stack>
  );
}

export default ScanComponent;
