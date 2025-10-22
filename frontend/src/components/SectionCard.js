import React from 'react';
import { Paper } from '@mui/material';

function SectionCard({ children, sx }) {
  return (
    <Paper elevation={1} sx={{ p: 2, ...sx }}>
      {children}
    </Paper>
  );
}

export default SectionCard;

