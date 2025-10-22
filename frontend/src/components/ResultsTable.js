import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, TableContainer } from '@mui/material';
import StatusChip from './StatusChip';

function ResultsTable({ results, dense = true }) {
  return (
    <TableContainer>
      <Table size={dense ? 'small' : 'medium'}>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Details</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((row, index) => (
            <TableRow key={index} hover>
              <TableCell sx={{ textTransform: 'capitalize' }}>{row.type}</TableCell>
              <TableCell><StatusChip status={row.status || 'detected'} /></TableCell>
              <TableCell sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \'Liberation Mono\', \'Courier New\', monospace' }}>
                {row.packet || row.details || row.error || ''}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ResultsTable;
