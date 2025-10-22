import React from 'react';
import { Box, Typography } from '@mui/material';

function StatCard({ label, value, color = 'primary.main' }) {
  return (
    <Box sx={{
      p: 2,
      borderRadius: 2,
      bgcolor: (theme) => theme.palette.mode === 'light' ? '#eef2ff' : '#0b1220',
      border: '1px solid',
      borderColor: 'divider',
    }}>
      <Typography variant="overline" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color }}>{value}</Typography>
    </Box>
  );
}

export default StatCard;

