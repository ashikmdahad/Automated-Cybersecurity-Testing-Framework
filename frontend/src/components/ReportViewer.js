import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Typography, Divider } from '@mui/material';

function ReportViewer({ markdown }) {
  return (
    <Box sx={{
      p: 2,
      bgcolor: 'background.default',
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      maxHeight: 420,
      overflow: 'auto'
    }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{children}</Typography>,
          h2: ({ children }) => <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, mb: .5 }}>{children}</Typography>,
          p: ({ children }) => <Typography variant="body2" sx={{ mb: 1 }}>{children}</Typography>,
          li: ({ children }) => <Typography component="li" variant="body2">{children}</Typography>,
          code: ({ children }) => (
            <Box component="code" sx={{ fontFamily: 'ui-monospace, monospace', px: .75, py: .25, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              {children}
            </Box>
          ),
          hr: () => <Divider sx={{ my: 1 }} />,
        }}
      >
        {markdown || 'No report yet.'}
      </ReactMarkdown>
    </Box>
  );
}

export default ReportViewer;

