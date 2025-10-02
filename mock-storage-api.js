// mock-storage-api.js
const express = require("express");

const app = express();
app.use(express.json());

// --- Root health check (for Test Connection) ---
app.get("/", (_req, res) =>
  res.json({ ok: true, service: "mock-storage-api" })
);

// ===== Helpers: deterministic pseudo-random generator =====
function fnv1a32(str) {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function prngForIdx(seed, idx) {
  let h = fnv1a32(`${seed}:${idx}`);
  return () => {
    h ^= h << 13; h >>>= 0;
    h ^= h >>> 17; h >>>= 0;
    h ^= h << 5;  h >>>= 0;
    return (h >>> 0) / 0xFFFFFFFF;
  };
}

function synthesizeFile(seed, idx, dirSpan = 1000, userCount = 120) {
  const rand = prngForIdx(seed, idx);
  const roots = ["projects","finance","legal","media","backups","home","departments/HR","departments/Eng","departments/IT","departments/OPS"];
  const exts  = [".pdf",".docx",".xlsx",".pptx",".csv",".txt",".jpg",".mp4",".zip"];

  const root = roots[Math.floor(rand() * roots.length)];
  const subA = `dir${Math.floor(rand() * dirSpan)}`;
  const subB = `dir${Math.floor(rand() * dirSpan)}`;
  const ext  = exts[Math.floor(rand() * exts.length)];
  const name = `file_${String(idx).padStart(6,"0")}${ext}`;

  const size = Math.max(512, Math.floor(Math.pow(rand(), 2.8) * 400 * 1024 * 1024));
  const daysAgo = Math.floor(rand() * 365 * 5);
  const mtime = new Date(Date.now() - daysAgo * 86400000).toISOString();
  const owner = `user${String(1 + Math.floor(rand() * userCount)).padStart(3, "0")}`;

  return { path: `/ifs/${root}/${subA}/${subB}/${name}`, size, mtime, owner };
}

function clampInt(v, min, max, fallback) {
  const n = Number.parseInt(v ?? "", 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

// --- /scan: paginated synthetic files with organic totals + capacity ---
app.get("/scan", (req, res) => {
  const requested = clampInt(req.query.count, 1000, 500000, 10000);

  // Add jitter ±10% so it looks organic
  const jitter = Math.floor(requested * 0.1);
  const total = requested + Math.floor((Math.random() * jitter * 2) - jitter);

  const page     = clampInt(req.query.page, 1, Number.MAX_SAFE_INTEGER, 1);
  const pageSize = clampInt(req.query.pageSize, 100, 10000, 1000);
  const systemId = req.query.systemId || "demo";
  const seed     = (req.query.seed || "storalogic") + ":" + systemId;

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx   = Math.min(startIdx + pageSize - 1, total);

  const files = [];
  for (let i = startIdx; i <= endIdx; i++) files.push(synthesizeFile(seed, i));

  const hasMore = endIdx < total;
  const directoryCount = Math.floor(total / 20) + 120;

  // approximate total bytes by sampling
  let sampleCount = Math.min(10000, total);
  let sampleBytes = 0;
  const step = Math.max(1, Math.floor(total / sampleCount));
  for (let i = 1; i <= total; i += step) sampleBytes += synthesizeFile(seed, i).size;
  const avgBytes = sampleBytes / Math.ceil(total / step);
  const physicalBytesEstimate = Math.floor(avgBytes * total);

  // capacity usage = between 30–80%
  const capacityUsagePercent = Math.floor(30 + Math.random() * 50);

  res.json({
    total,
    page,
    pageSize,
    hasMore,
    files,
    stats: {
      fileCount: total,
      directoryCount,
      uniqueUsers: 120,
      physicalBytes: physicalBytesEstimate,
      capacityUsagePercent
    }
  });
});

// --- /stats: summary numbers for dashboards with organic totals + capacity ---
app.get("/stats", (req, res) => {
  const requested = clampInt(req.query.count, 1000, 500000, 10000);
  const jitter = Math.floor(requested * 0.1);
  const total = requested + Math.floor((Math.random() * jitter * 2) - jitter);

  const systemId = req.query.systemId || "demo";
  const seed     = (req.query.seed || "storalogic") + ":" + systemId;

  let sampleCount = Math.min(10000, total);
  let sampleBytes = 0;
  const step = Math.max(1, Math.floor(total / sampleCount));
  for (let i = 1; i <= total; i += step) sampleBytes += synthesizeFile(seed, i).size;
  const avgBytes = sampleBytes / Math.ceil(total / step);
  const physicalBytesEstimate = Math.floor(avgBytes * total);

  const capacityUsagePercent = Math.floor(30 + Math.random() * 50);

  res.json({
    fileCount: total,
    directoryCount: Math.floor(total / 20) + 120,
    uniqueUsers: 120,
    physicalBytes: physicalBytesEstimate,
    capacityUsagePercent
  });
});

// --- Start server (Render requires 0.0.0.0) ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Mock Storage API running on port ${PORT}`);
});
