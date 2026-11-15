export interface ProcessInput {
  id: number;
  arrivalTime: number;
  burstTime: number;
}

export interface Process extends ProcessInput {
  startTime: number;
  endTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
  remainingTime: number;
}

export interface SimulationResult {
  totalTime: number;
  avgTurnaroundTime: number;
  avgWaitingTime: number;
  avgResponseTime: number;
  cpuEfficiency: number;
  processes: Process[];
}

function prepareProcesses(input: ProcessInput[]): Process[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new RangeError('Provide at least one process.');
  }

  const ids = new Set<number>();
  return input.map(({ id, arrivalTime, burstTime }) => {
    if (!Number.isSafeInteger(id) || id < 1 || ids.has(id)) {
      throw new RangeError('Each process needs a unique positive integer ID.');
    }
    if (!Number.isSafeInteger(arrivalTime) || arrivalTime < 0) {
      throw new RangeError('Arrival times must be non-negative integers.');
    }
    if (!Number.isSafeInteger(burstTime) || burstTime < 1) {
      throw new RangeError('Burst times must be positive integers.');
    }
    ids.add(id);
    return {
      id, arrivalTime, burstTime, remainingTime: burstTime,
      startTime: -1, endTime: -1, turnaroundTime: 0,
      waitingTime: 0, responseTime: 0,
    };
  }).sort((a, b) => a.arrivalTime - b.arrivalTime || a.id - b.id);
}

function calculateMetrics(processes: Process[]): SimulationResult {
  const totalTime = Math.max(...processes.map(process => process.endTime));
  let turnaround = 0;
  let waiting = 0;
  let response = 0;
  let busyTime = 0;

  for (const process of processes) {
    process.turnaroundTime = process.endTime - process.arrivalTime;
    process.waitingTime = process.turnaroundTime - process.burstTime;
    process.responseTime = process.startTime - process.arrivalTime;
    turnaround += process.turnaroundTime;
    waiting += process.waitingTime;
    response += process.responseTime;
    busyTime += process.burstTime;
  }

  return {
    totalTime,
    avgTurnaroundTime: turnaround / processes.length,
    avgWaitingTime: waiting / processes.length,
    avgResponseTime: response / processes.length,
    // The simulator does not model context-switch cost. Idle periods are included.
    cpuEfficiency: (busyTime / totalTime) * 100,
    processes,
  };
}

export function runFCFS(inputProcesses: ProcessInput[]): SimulationResult {
  const processes = prepareProcesses(inputProcesses);
  let currentTime = 0;

  for (const process of processes) {
    currentTime = Math.max(currentTime, process.arrivalTime);
    process.startTime = currentTime;
    currentTime += process.burstTime;
    process.endTime = currentTime;
    process.remainingTime = 0;
  }

  return calculateMetrics(processes);
}

export function runRR(inputProcesses: ProcessInput[], timeQuantum: number): SimulationResult {
  if (!Number.isSafeInteger(timeQuantum) || timeQuantum < 1) {
    throw new RangeError('Time quantum must be a positive integer.');
  }

  const processes = prepareProcesses(inputProcesses);
  const readyQueue: Process[] = [];
  let nextArrival = 0;
  let completed = 0;
  let currentTime = 0;

  function enqueueArrivals() {
    while (nextArrival < processes.length && processes[nextArrival].arrivalTime <= currentTime) {
      readyQueue.push(processes[nextArrival]);
      nextArrival++;
    }
  }

  while (completed < processes.length) {
    if (readyQueue.length === 0) {
      // Jump past idle time rather than incrementing one tick at a time.
      currentTime = Math.max(currentTime, processes[nextArrival].arrivalTime);
      enqueueArrivals();
    }

    const process = readyQueue.shift()!;
    if (process.startTime === -1) process.startTime = currentTime;

    const duration = Math.min(timeQuantum, process.remainingTime);
    process.remainingTime -= duration;
    currentTime += duration;

    // Processes arriving during the slice queue before the preempted process.
    enqueueArrivals();
    if (process.remainingTime > 0) {
      readyQueue.push(process);
    } else {
      process.endTime = currentTime;
      completed++;
    }
  }

  return calculateMetrics(processes);
}
