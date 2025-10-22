import React from 'react';
import axios from 'axios';
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Toolbar, Typography, Button, Stack, TextField, MenuItem, TableContainer, ButtonGroup } from '@mui/material';
import StatusChip from './StatusChip';
import { exportToCSV, exportToJSON } from '../utils/export';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

function History() {
  const [rows, setRows] = React.useState([]);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');

  const fetchHistory = async () => {
    const res = await axios.get(`${API_BASE}/api/results`);
    setRows(res.data.results || []);
  };

  const clearHistory = async () => {
    await axios.delete(`${API_BASE}/api/results`);
    await fetchHistory();
  };

  React.useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = rows.filter(r => {
    const statusOk = statusFilter === 'all' || (r.status || '').toLowerCase() === statusFilter;
    const typeOk = typeFilter === 'all' || (r.type || '').toLowerCase() === typeFilter;
    return statusOk && typeOk;
  });

  return (
    <Paper sx={{ p: 2 }}>
      <Toolbar disableGutters sx={{ mb: 2, justifyContent: 'space-between' }}>
        <Typography variant="h6">History</Typography>
        <Stack direction="row" spacing={2}>
          <TextField select size="small" label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="detected">Detected</MenuItem>
            <MenuItem value="success">Success</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="no_traffic">No Traffic</MenuItem>
          </TextField>
          <TextField select size="small" label="Type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="sniff">Sniff</MenuItem>
            <MenuItem value="inject">Inject</MenuItem>
          </TextField>
          <Button variant="outlined" onClick={fetchHistory}>Refresh</Button>
          <ButtonGroup variant="outlined" size="small">
            <Button onClick={() => exportToCSV('history.csv', filtered)}>Export CSV</Button>
            <Button onClick={() => exportToJSON('history.json', filtered)}>Export JSON</Button>
          </ButtonGroup>
          <Button color="error" variant="outlined" onClick={clearHistory}>Clear History</Button>
        </Stack>
      </Toolbar>
      <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Timestamp</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Details</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.id}</TableCell>
              <TableCell>{r.timestamp}</TableCell>
              <TableCell>{r.type}</TableCell>
              <TableCell><StatusChip status={r.status} /></TableCell>
              <TableCell>{r.details}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </TableContainer>
    </Paper>
  );
}

export default History;
