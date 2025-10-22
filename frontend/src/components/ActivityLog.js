import React from 'react';
import { Paper, List, ListItem, ListItemText, Typography, ListItemIcon, Chip, Divider, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

function iconFor(level) {
  switch ((level || '').toLowerCase()) {
    case 'success':
      return <CheckCircleIcon color="success" fontSize="small" />;
    case 'error':
      return <ErrorIcon color="error" fontSize="small" />;
    default:
      return <InfoIcon color="info" fontSize="small" />;
  }
}

function ActivityLog({ logs = [] }) {
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6">Activity</Typography>
        <Chip size="small" label={`${logs.length} events`} />
      </Box>
      <Divider sx={{ mb: 1 }} />
      <List dense sx={{ maxHeight: 260, overflow: 'auto' }}>
        {logs.length === 0 && (
          <ListItem>
            <ListItemText primary="No activity yet." />
          </ListItem>
        )}
        {logs.map((l, idx) => (
          <ListItem key={idx} sx={{ py: 0.5 }}>
            <ListItemIcon>
              {iconFor(l.level)}
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ sx: { fontFamily: 'ui-monospace, monospace' } }}
              primary={`[${new Date(l.t).toLocaleTimeString()}] ${l.msg}`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export default ActivityLog;
