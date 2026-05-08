import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import os from "os";
import { botState } from "../bot/state.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const uploadDir = path.join(os.tmpdir(), "mehnat-bot-uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    cb(null, `excel_${Date.now()}.xlsx`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".xlsx" || ext === ".xls") {
      cb(null, true);
    } else {
      cb(new Error("Faqat Excel fayllari qabul qilinadi (.xlsx, .xls)"));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

function countExcelRows(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath);
    const str = content.toString("binary");
    const sharedStrings = (str.match(/<si>/g) || []).length;
    return Math.max(sharedStrings - 20, 0);
  } catch {
    return 0;
  }
}

router.post("/bot/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Fayl yuklanmadi" });
    return;
  }

  const rowCount = countExcelRows(req.file.path);
  botState.setExcelFile(req.file.path, rowCount);
  logger.info({ file: req.file.filename, rowCount }, "Excel fayl yuklandi");

  res.json({
    filename: req.file.originalname,
    rowCount,
    message: `${req.file.originalname} muvaffaqiyatli yuklandi`,
  });
});

router.post("/bot/start", (req, res) => {
  if (botState.isRunning()) {
    res.status(400).json({ error: "Bot allaqachon ishlayapti" });
    return;
  }

  const state = botState.getFullState();
  if (!state.hasExcelFile || !state.excelFilePath) {
    res.status(400).json({ error: "Avval Excel fayl yuklang" });
    return;
  }

  const settings = botState.getSettings();
  const stopFile = path.join(os.tmpdir(), `stop_${Date.now()}.signal`);
  const settingsJson = JSON.stringify(settings);

  const botScriptPath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "..",
    "bot",
    "bot.py"
  );

  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  const proc = spawn(pythonCmd, [botScriptPath, state.excelFilePath, settingsJson, stopFile], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env },
  });

  const runId = botState.startRun(proc, state.excelRowCount || 0, stopFile);

  botState.addLog("info", "Bot ishga tushirildi");

  proc.stdout?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        botState.addLog(
          parsed.level || "info",
          parsed.message || line,
          parsed.rowNumber ?? null
        );
      } catch {
        botState.addLog("info", line);
      }
    }
  });

  proc.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) botState.addLog("error", msg);
  });

  proc.on("close", (code) => {
    if (fs.existsSync(stopFile)) {
      fs.unlinkSync(stopFile);
      botState.completeRun("stopped");
      botState.addLog("info", "Bot to'xtatildi");
    } else if (code === 0) {
      botState.completeRun("completed");
      botState.addLog("success", "Bot muvaffaqiyatli yakunlandi!");
    } else {
      botState.completeRun("error");
      botState.addLog("error", `Bot xato bilan to'xtadi (kod: ${code})`);
    }
    logger.info({ code, runId }, "Bot process yakunlandi");
  });

  proc.on("error", (err) => {
    botState.addLog("error", `Bot ishga tushmadi: ${err.message}`);
    botState.completeRun("error");
    logger.error({ err }, "Bot process xatosi");
  });

  const run = {
    id: runId,
    status: "running" as const,
    startedAt: new Date().toISOString(),
    completedAt: null,
    totalRows: state.excelRowCount || 0,
    processedRows: 0,
    failedRows: 0,
  };

  res.json(run);
});

router.post("/bot/stop", (req, res) => {
  const state = botState.getFullState();
  if (!botState.isRunning()) {
    res.json({ message: "Bot ishlamayapti" });
    return;
  }

  if (state.stopFilePath) {
    fs.writeFileSync(state.stopFilePath, "stop");
  }

  if (state.process) {
    state.process.kill("SIGTERM");
  }

  botState.addLog("warn", "To'xtatish signali yuborildi...");
  res.json({ message: "Bot to'xtatilmoqda..." });
});

router.get("/bot/status", (_req, res) => {
  res.json(botState.getStatus());
});

router.get("/bot/logs", (req, res) => {
  const limit = parseInt(String(req.query["limit"] || "100"));
  res.json(botState.getLogs(limit));
});

router.get("/bot/history", (_req, res) => {
  res.json(botState.getHistory());
});

router.get("/bot/preview", (_req, res) => {
  const state = botState.getFullState();
  if (!state.hasExcelFile || !state.excelFilePath) {
    res.json({ headers: [], rows: [], totalCount: 0 });
    return;
  }

  res.json({
    headers: [],
    rows: [],
    totalCount: state.excelRowCount || 0,
  });
});

export default router;
