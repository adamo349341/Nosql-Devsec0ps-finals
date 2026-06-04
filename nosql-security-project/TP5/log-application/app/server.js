const express = require("express");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_DIR = process.env.LOG_DIR || "./logs";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/logviewer";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let db = null;

async function connectMongo() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db("logviewer");

    await db.collection("logs").createIndex({ timestamp: -1 });
    await db.collection("logs").createIndex({ level: 1 });
    await db.collection("logs").createIndex({ file: 1 });

    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

function detectLevel(line) {
  const u = line.toUpperCase();
  if (u.includes("[ERROR]") || u.includes("ERROR")) return "ERROR";
  if (u.includes("[WARN]") || u.includes("WARN")) return "WARN";
  if (u.includes("[INFO]") || u.includes("INFO")) return "INFO";
  if (u.includes("[DEBUG]") || u.includes("DEBUG")) return "DEBUG";
  return "NONE";
}

// GET /api/files
app.get("/api/files", (req, res) => {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    const files = fs.readdirSync(LOG_DIR).filter((f) => f.endsWith(".log"));
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logs/:filename
app.get("/api/logs/:filename", (req, res) => {
  const filePath = path.join(LOG_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const search = req.query.search || "";
  const level = req.query.level || "";

  const lines = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
  });

  rl.on("line", (line) => {
    if (search && !line.toLowerCase().includes(search.toLowerCase())) return;
    if (level && !line.toUpperCase().includes(`[${level.toUpperCase()}]`)) return;
    lines.push(line);
  });

  rl.on("close", () => {
    const total = lines.length;
    const start = (page - 1) * limit;
    const paginated = lines.slice(start, start + limit);
    res.json({ total, page, limit, lines: paginated });
  });

  rl.on("error", (err) => {
    res.status(500).json({ error: err.message });
  });
});

// POST /api/logs
app.post("/api/logs", async (req, res) => {
  try {
    const { message, level, file, meta } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const doc = {
      message,
      level: (level || detectLevel(message)).toUpperCase(),
      file: file || "api",
      meta: meta || {},
      timestamp: new Date(),
    };

    await db.collection("logs").insertOne(doc);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/db/logs
app.get("/api/db/logs", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const search = req.query.search || "";
    const level = req.query.level || "";
    const file = req.query.file || "";

    const filter = {};
    if (level) filter.level = level.toUpperCase();
    if (file) filter.file = file;
    if (search) filter.message = { $regex: search, $options: "i" };

    const total = await db.collection("logs").countDocuments(filter);
    const logs = await db.collection("logs")
      .find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json({ total, page, limit, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logs/:filename/stream
app.get("/api/logs/:filename/stream", (req, res) => {
  const filePath = path.join(LOG_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(filePath)) return res.status(404).end();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let size = fs.statSync(filePath).size;

  const interval = setInterval(() => {
    const newSize = fs.statSync(filePath).size;

    if (newSize > size) {
      const stream = fs.createReadStream(filePath, { start: size, end: newSize });
      let chunk = "";

      stream.on("data", (d) => {
        chunk += d.toString();
      });

      stream.on("end", async () => {
        const newLines = chunk.split("\n").filter(Boolean);

        newLines.forEach((line) => {
          res.write(`data: ${JSON.stringify({ line })}\n\n`);
        });

        try {
          if (newLines.length > 0) {
            const docs = newLines.map((line) => ({
              message: line,
              level: detectLevel(line),
              file: req.params.filename,
              meta: {},
              timestamp: new Date(),
            }));

            await db.collection("logs").insertMany(docs);
          }
        } catch (err) {
          console.error("Failed to persist streamed logs:", err.message);
        }
      });

      size = newSize;
    }
  }, 1000);

  req.on("close", () => clearInterval(interval));
});

// GET /api/stats
app.get("/api/stats", async (req, res) => {
  try {
    const fileStats = { error: 0, warn: 0, info: 0, debug: 0, total: 0 };

    if (fs.existsSync(LOG_DIR)) {
      const files = fs.readdirSync(LOG_DIR).filter((f) => f.endsWith(".log"));
      for (const file of files) {
        const content = fs.readFileSync(path.join(LOG_DIR, file), "utf8");
        const lines = content.split("\n").filter(Boolean);
        fileStats.total += lines.length;

        lines.forEach((l) => {
          const u = l.toUpperCase();
          if (u.includes("[ERROR]")) fileStats.error++;
          else if (u.includes("[WARN]")) fileStats.warn++;
          else if (u.includes("[INFO]")) fileStats.info++;
          else if (u.includes("[DEBUG]")) fileStats.debug++;
        });
      }
    }

    const [error, warn, info, debug, total] = await Promise.all([
      db.collection("logs").countDocuments({ level: "ERROR" }),
      db.collection("logs").countDocuments({ level: "WARN" }),
      db.collection("logs").countDocuments({ level: "INFO" }),
      db.collection("logs").countDocuments({ level: "DEBUG" }),
      db.collection("logs").countDocuments(),
    ]);

    res.json({
      error: fileStats.error + error,
      warn: fileStats.warn + warn,
      info: fileStats.info + info,
      debug: fileStats.debug + debug,
      total: fileStats.total + total,
      source: "files+mongodb",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

connectMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Log viewer running on port ${PORT}`);
  });
});