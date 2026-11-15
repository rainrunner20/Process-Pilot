# Scheduler behavior

The web implementation compares non-preemptive first-come, first-served (FCFS) scheduling and preemptive round robin (RR) scheduling. It is a deterministic teaching simulator, not a real OS scheduler.

## Input

Each process has a unique positive integer ID, a non-negative integer arrival time, and a positive integer CPU burst. Identical arrival times are ordered by ID to keep results reproducible. Invalid values raise a descriptive \`RangeError\` in the scheduling library.

## FCFS

Processes run to completion in arrival order. The CPU advances to the next arrival when the ready queue is empty.

## Round robin

A ready process runs for up to \`timeQuantum\` units. Processes arriving during its time slice join the ready queue **before** the preempted process is placed back at the tail. A process's first run determines response time; subsequent runs do not reset it.

Example: P1 arrives at 0 with a burst of 5; P2 arrives at 1 with a burst of 2; quantum is 2.

- P1 runs 0–2.
- P2 runs 2–4.
- P1 runs 4–6 and 6–7.

P2 completes at time 4 (not time 6). The order matters for average waiting and response times.

## Metrics and limitations

- Turnaround: completion time minus arrival time.
- Waiting: turnaround time minus CPU burst.
- Response: first start time minus arrival time.
- CPU utilization (displayed as "efficiency" for compatibility): total busy CPU time divided by elapsed simulation time, times 100.

The model includes idle periods but **does not simulate context-switch overhead**. The previous implementation added an assumed context-switch penalty only to the denominator without advancing the simulation clock; this gave misleading comparisons. If switching overhead becomes a feature, it should affect event times and metrics consistently.

The REST API's text parser and UI error messages still need separate validation work. This change fixes the core library and installs regression coverage without claiming those layers are production-ready.

## Verify

With Node.js 22 or newer:

\`\`\`powershell
cd cpu-scheduler
npm test
\`\`\`

GitHub Actions runs the same deterministic test suite on pull requests that touch scheduling code.
