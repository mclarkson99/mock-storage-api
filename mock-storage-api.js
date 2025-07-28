const express = require('express');
const app = express();
const port = 4000;

app.use(express.json());

app.get('/scan', (req, res) => {
  res.json({
    files: [
      {
        path: '/ifs/projects/report.docx',
        size: 1048576,
        last_modified: '2023-11-01T12:00:00Z',
        last_accessed: '2023-12-15T08:30:00Z',
        owner: 'alice',
      },
      {
        path: '/ifs/archive/photo.png',
        size: 524288,
        last_modified: '2022-07-22T09:00:00Z',
        last_accessed: '2023-06-01T10:00:00Z',
        owner: 'bob',
      }
    ],
    total_count: 2,
    total_size: 1572864
  });
});

app.listen(port, () => {
  console.log(`✅ Mock Storage API running at http://localhost:${port}`);
});
