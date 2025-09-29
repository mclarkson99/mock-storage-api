// mock-storage-api.js
const express = require("express");

const app = express();
app.use(express.json());

// --- Root health check (for Test Connection) ---
app.get("/", (_req, res) => res.json({ ok: true, service: "mock-storage-api" }));

// --- Original endpoint you already had ---
app.get("/api/files", (_req, res) => {
  res.json({
    files: [
      {
        path: "/ifs/projects/report.docx",
        size: 1048576,
        last_modified: "2023-11-01T12:00:00Z",
        last_accessed: "2023-12-15T08:30:00Z",
        owner: "alice",
      },
      {
        path: "/ifs/archive/photo.png",
        size: 524288,
        last_modified: "2022-07-22T09:00:00Z",
        last_accessed: "2023-06-01T10:00:00Z",
        owner: "bob",
      },
    ],
    total_count: 2,
    total_size: 1572864,
  });
});

// --- New: /scan endpoint for files (simplified payload) ---
app.get("/scan", (_req, res) => {
  res.json({
    files: [
      { path: "/ifs/projects/report.docx", size_bytes: 1048576, owner: "alice" },
      { path: "/ifs/archive/photo.png", size_bytes: 524288, owner: "bob" },
    ],
  });
});

// --- New: /metrics endpoint for capacity snapshot ---
app.get("/metrics", (_req, res) => {
  res.json({
    capacity_usage_percent: 42.5,
    directory_count: 2,
    file_count: 2,
    unique_user_count: 2,
  });
});

// --- IMPORTANT: use Render PORT + bind 0.0.0.0 ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Mock Storage API running on port ${PORT}`);
});
