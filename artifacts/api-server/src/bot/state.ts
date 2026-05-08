import { ChildProcess } from "child_process";
import { v4 as uuidv4 } from "uuid";

export type BotStatus = "idle" | "running" | "stopping" | "error" | "completed";
export type LogLevel = "info" | "warn" | "error" | "success";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  rowNumber: number | null;
}

export interface BotRun {
  id: string;
  status: "running" | "completed" | "stopped" | "error";
  startedAt: string;
  completedAt: string | null;
  totalRows: number;
  processedRows: number;
  failedRows: number;
}

export interface BotSettings {
  password: string;
  employeeSearch: string;
  defaultHudud: string;
  defaultTuman: string;
  defaultMahalla: string;
  defaultYonalish: string;
  defaultOy: string;
  defaultShartnomaUri: string;
  defaultIshBoshlangan: string;
  defaultShartnamaSan: string;
  defaultBajarilgan: string;
  headless: boolean;
}

export interface BotState {
  status: BotStatus;
  currentRunId: string | null;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  startedAt: string | null;
  hasExcelFile: boolean;
  excelFilePath: string | null;
  excelRowCount: number;
  process: ChildProcess | null;
  stopFilePath: string | null;
}

const MAX_LOGS = 1000;

class BotStateManager {
  private state: BotState = {
    status: "idle",
    currentRunId: null,
    totalRows: 0,
    processedRows: 0,
    failedRows: 0,
    startedAt: null,
    hasExcelFile: false,
    excelFilePath: null,
    excelRowCount: 0,
    process: null,
    stopFilePath: null,
  };

  private logs: LogEntry[] = [];
  private history: BotRun[] = [];
  private settings: BotSettings = {
    password: "37212685",
    employeeSearch: "TEMURSULTON",
    defaultHudud: "Самарқанд вилояти",
    defaultTuman: "Ургут тумани",
    defaultMahalla: "Бахринси",
    defaultYonalish: "пиллачилик соҳасида аҳолини мавсумий банд қилиш",
    defaultOy: "Aпрел",
    defaultShartnomaUri: "Фуқаролик-ҳуқуқий шартнома",
    defaultIshBoshlangan: "2026-04-01",
    defaultShartnamaSan: "2026-04-01",
    defaultBajarilgan: "Ёрдамчи",
    headless: true,
  };

  getStatus(): Omit<BotState, "process" | "stopFilePath" | "excelRowCount" | "excelFilePath"> {
    return {
      status: this.state.status,
      currentRunId: this.state.currentRunId,
      totalRows: this.state.totalRows,
      processedRows: this.state.processedRows,
      failedRows: this.state.failedRows,
      startedAt: this.state.startedAt,
      hasExcelFile: this.state.hasExcelFile,
    };
  }

  getFullState(): BotState {
    return this.state;
  }

  setExcelFile(filePath: string, rowCount: number) {
    this.state.excelFilePath = filePath;
    this.state.excelRowCount = rowCount;
    this.state.hasExcelFile = true;
  }

  startRun(process: ChildProcess, totalRows: number, stopFilePath: string): string {
    const runId = uuidv4();
    this.state.status = "running";
    this.state.currentRunId = runId;
    this.state.totalRows = totalRows;
    this.state.processedRows = 0;
    this.state.failedRows = 0;
    this.state.startedAt = new Date().toISOString();
    this.state.process = process;
    this.state.stopFilePath = stopFilePath;
    this.logs = [];

    const run: BotRun = {
      id: runId,
      status: "running",
      startedAt: this.state.startedAt,
      completedAt: null,
      totalRows,
      processedRows: 0,
      failedRows: 0,
    };
    this.history.unshift(run);

    return runId;
  }

  addLog(level: LogLevel, message: string, rowNumber: number | null = null) {
    const entry: LogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      message,
      rowNumber,
    };
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(-MAX_LOGS);
    }

    if (message.includes("muvaffaqiyatli saqlandi") || message.includes("muvaffaqiyatli!")) {
      this.state.processedRows++;
    } else if (message.includes("xato") && rowNumber !== null) {
      this.state.failedRows++;
    }

    if (message.startsWith("Holat:")) {
      const match = message.match(/(\d+)\/(\d+) muvaffaqiyatli/);
      if (match) {
        this.state.processedRows = parseInt(match[1]);
        this.state.totalRows = parseInt(match[2]);
      }
    }

    const currentRun = this.history.find((r) => r.id === this.state.currentRunId);
    if (currentRun) {
      currentRun.processedRows = this.state.processedRows;
      currentRun.failedRows = this.state.failedRows;
      currentRun.totalRows = this.state.totalRows;
    }
  }

  completeRun(status: "completed" | "stopped" | "error") {
    const completedAt = new Date().toISOString();
    this.state.status = status === "completed" ? "completed" : status === "stopped" ? "idle" : "error";
    this.state.process = null;
    this.state.stopFilePath = null;

    const currentRun = this.history.find((r) => r.id === this.state.currentRunId);
    if (currentRun) {
      currentRun.status = status;
      currentRun.completedAt = completedAt;
      currentRun.processedRows = this.state.processedRows;
      currentRun.failedRows = this.state.failedRows;
    }
  }

  getLogs(limit = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  getHistory(): BotRun[] {
    return this.history.slice(0, 50);
  }

  getSettings(): BotSettings {
    return this.settings;
  }

  updateSettings(updates: Partial<BotSettings>): BotSettings {
    this.settings = { ...this.settings, ...updates };
    return this.settings;
  }

  isRunning(): boolean {
    return this.state.status === "running" || this.state.status === "stopping";
  }
}

export const botState = new BotStateManager();
