import React from 'react';
import { Chip } from '@mui/material';

const colorMap = {
  success: 'success',
  detected: 'warning',
  failed: 'error',
  no_traffic: 'default',
};

function StatusChip({ status }) {
  const key = (status || '').toLowerCase();
  const color = colorMap[key] || 'default';
  const label = key || 'unknown';
  return <Chip size="small" color={color} variant={color === 'default' ? 'outlined' : 'filled'} label={label} />;
}

export default StatusChip;

