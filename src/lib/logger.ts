export interface LogEntry {
  timestamp: string;
  provider: string;
  endpoint: string;
  status: number | null;
  latencyMs: number;
  error: string | null;
}

const MAX_ENTRIES = 50;
const logBuffer: LogEntry[] = [];

export function logApiCall(entry: Omit<LogEntry, 'timestamp'>) {
  logBuffer.unshift({ ...entry, timestamp: new Date().toISOString() });
  if (logBuffer.length > MAX_ENTRIES) logBuffer.pop();
}

export function getLogEntries(): LogEntry[] {
  return [...logBuffer];
}

export function clearLogEntries() {
  logBuffer.length = 0;
}
