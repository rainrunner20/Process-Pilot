# Process-Pilot

A deterministic CPU scheduling simulator that compares **First-Come, First-Served**
(FCFS) and **Round Robin** (RR). It began as a C++ coursework project and
also includes a modern Next.js/TypeScript application with an HTTP API.

The application shows per-process completion, turnaround, waiting and
response times, and total CPU utilization. It models idle time but **does
not simulate context-switch overhead**. This is a learning simulator, not
an operating system scheduler.

![Existing simulator screenshot](image-2.png)

## Run the web application (PowerShell)

Requires Node.js 22 or later.

```powershell
git clone https://github.com/rainrunner20/Process-Pilot.git
cd Process-Pilot/cpu-scheduler
npm ci
npm test
npm run dev
```

Open http://localhost:3000. The form has a valid sample workload, so
**no AI provider key or database is required** to simulate a schedule.
The optional AI input generator depends on a legacy external provider
and is not needed for normal use.

### Input format

One process per line, with three integers:

```text
1 0 8
2 1 3
3 4 6
4 6 2
5 9 4
```

The fields are: **Process ID**, **arrival time**, **CPU burst length**.
IDs must be unique positive integers; arrival times must be nonnegative;
bursts must be between 1 and 10,000 units. Blank lines are allowed.
For RR, enter a positive time quantum of at most 10,000 units.

Invalid input returns an HTTP 400 with a useful error message rather
than crashing the server. Other limits cap process count and workload
size. See [input validation contract](cpu-scheduler/docs/INPUT_VALIDATION.md).

## How the scheduling works

**FCFS:** Run processes in arrival order, with ties ordered by ID.
The CPU is idle if no process has arrived.

**Round Robin:** Run a ready process for at most its quantum; processes
that arrive during a time slice join the queue before the preempted
process returns to its tail. This matters for correct waiting time and
fairness metrics.

The same underlying scheduling library powers the API and tests.
[Scheduling specification](cpu-scheduler/docs/SCHEDULING.md).

## Measurements

| Metric | Definition |
| --- | --- |
| Turnaround time | Completion time − arrival time |
| Waiting time | Turnaround time − CPU burst |
| Response time | First CPU start − arrival time |
| CPU utilization | Busy CPU time ÷ elapsed simulation time |

The UI keeps the old field name 'CPU Efficiency' for compatibility,
but it represents utilization, not a measured gain in performance.

## Engineering checks

GitHub Actions runs Node.js regression tests on scheduler changes.
The tests cover idle periods, Round Robin enqueue order, input
immutability, invalid workloads and malformed API inputs.

## Original C++ version

The repository also retains the original C++ implementation in
`main.cpp`. To compile it independently:

```powershell
g++ -std=c++17 main.cpp -o process-pilot.exe
.\process-pilot.exe
```

The TypeScript library has its own documented assumptions and tests;
the older C++ implementation has not been shown to have identical
semantics or test coverage.

## Known limitations

- No real operating-system integration or context-switch cost.
- No measured performance claims from large-scale benchmarks.
- The AI input generator is optional and its provider integration
  has not been modernized or independently verified.
- The Next.js UI still needs a confirmed hosted deployment and
  wider browser-based end-to-end test coverage.

This README describes what the code does today, not planned features.
