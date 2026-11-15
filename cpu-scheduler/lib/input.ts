import type { ProcessInput } from './scheduler';

export type Algorithm = 'FCFS' | 'RR';
export interface SimulationRequest {
  algorithm: Algorithm;
  processes: ProcessInput[];
  timeQuantum?: number;
}

export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InputError';
  }
}

const MAX_PROCESSES = 1000;
const MAX_BURST = 10_000;
const MAX_TOTAL_BURST = 1_000_000;
const MAX_TEXT_LENGTH = 64_000;

export function parseWorkload(value: unknown): ProcessInput[] {
  if (typeof value !== 'string' || !value.trim()) {
    throw new InputError('Enter one process per line in the format: ID Arrival Burst.');
  }
  if (value.length > MAX_TEXT_LENGTH) {
    throw new InputError('Process input must be 64,000 characters or fewer.');
  }

  const processes: ProcessInput[] = [];
  const ids = new Set<number>();
  let totalBurst = 0;

  for (const [index, original] of value.split(/\r?\n/).entries()) {
    const line = original.trim();
    if (!line) continue;
    if (!/^\d+\s+\d+\s+\d+$/.test(line)) {
      throw new InputError('Line ' + (index + 1) + ': expected exactly three non-negative integers (ID Arrival Burst).');
    }
    const [id, arrivalTime, burstTime] = line.split(/\s+/).map(Number);
    if (!Number.isSafeInteger(id) || id < 1 || ids.has(id)) {
      throw new InputError('Line ' + (index + 1) + ': process ID must be unique and positive.');
    }
    if (!Number.isSafeInteger(arrivalTime)) {
      throw new InputError('Line ' + (index + 1) + ': arrival time is outside the supported range.');
    }
    if (!Number.isSafeInteger(burstTime) || burstTime < 1 || burstTime > MAX_BURST) {
      throw new InputError('Line ' + (index + 1) + ': burst must be between 1 and ' + MAX_BURST + '.');
    }
    totalBurst += burstTime;
    if (totalBurst > MAX_TOTAL_BURST) {
      throw new InputError('Total burst time cannot exceed ' + MAX_TOTAL_BURST + '.');
    }
    ids.add(id);
    processes.push({ id, arrivalTime, burstTime });
    if (processes.length > MAX_PROCESSES) {
      throw new InputError('A simulation can contain at most ' + MAX_PROCESSES + ' processes.');
    }
  }

  if (!processes.length) {
    throw new InputError('At least one process is required.');
  }
  return processes;
}

export function parseSimulationRequest(body: unknown): SimulationRequest {
  if (body === null || Array.isArray(body) || typeof body !== 'object') {
    throw new InputError('Request body must be a JSON object.');
  }
  const payload = body as Record<string, unknown>;
  if (payload.algorithm !== 'FCFS' && payload.algorithm !== 'RR') {
    throw new InputError('Algorithm must be FCFS or RR.');
  }
  const processes = parseWorkload(payload.processes);
  if (payload.algorithm === 'RR') {
    const quantum = payload.timeQuantum;
    if (typeof quantum !== 'number' || !Number.isSafeInteger(quantum) || quantum < 1 || quantum > MAX_BURST) {
      throw new InputError('Round Robin quantum must be an integer between 1 and ' + MAX_BURST + '.');
    }
    return { algorithm: 'RR', processes, timeQuantum: quantum };
  }
  return { algorithm: 'FCFS', processes };
}
