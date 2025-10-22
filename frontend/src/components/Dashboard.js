import React from 'react';
import { Typography, CircularProgress, Stack, Chip } from '@mui/material';

function Dashboard({ scanning }) {
  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Typography variant="h6">Scan Status</Typography>
      {scanning ? (
        <Stack direction="row" alignItems="center" spacing={1}>
          <CircularProgress size={18} />
          <Chip size="small" color="info" label="Running" />
        </Stack>
      ) : (
        <Chip size="small" color="success" label="Idle" />
      )}
    </Stack>
  );
}

export default Dashboard;
