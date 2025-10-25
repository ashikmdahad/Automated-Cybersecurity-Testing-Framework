import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';

function SevChip({ severity }) {
  const sev = (severity || '').toLowerCase();
  const color = sev === 'high' ? 'error' : sev === 'medium' ? 'warning' : 'default';
  return <Chip size="small" color={color} label={sev || 'info'} />;
}

function FindingsTable({ findings = [] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Rule</TableCell>
            <TableCell>Severity</TableCell>
            <TableCell>CAN ID</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {findings.map((f, idx) => (
            <TableRow key={idx} hover>
              <TableCell>{f.rule_id}</TableCell>
              <TableCell><SevChip severity={f.severity} /></TableCell>
              <TableCell>{f.affected_id || '-'}</TableCell>
              <TableCell>{f.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default FindingsTable;

