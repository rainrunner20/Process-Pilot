# Input and API behavior

The simulator accepts one process per line with three whitespace-separated integers:

- Process ID: unique positive safe integer
- Arrival time: nonnegative safe integer
- Burst time: 1 to 10,000 time units

Blank lines and Windows newlines are supported. Invalid rows return HTTP **400** and a
line-specific error message rather than causing an unhandled exception.

## Request example

POST `/api/simulate` with JSON:

```json
{
  "algorithm": "RR",
  "processes": "1 0 5\n2 1 2",
  "timeQuantum": 2
}
```

## Response behavior

- 200: a deterministic scheduling result with process metrics.
- 400: missing/invalid request body, algorithm, workload or Round Robin quantum.
- 405: methods other than POST (includes an `Allow: POST` response header).
- 500: unexpected server failure; internal details are not returned to clients.

Input is limited to 1,000 processes, 64,000 input characters and 1,000,000 total
burst units. Round Robin quantum must be a safe integer between 1 and 10,000. These
limits cap typical simulation cost; they do not replace application-level rate limiting.

The UI starts with a valid local example. AI-generated input remains **optional** and
depends on the external provider's availability and credentials. Simulation works
without an AI API key. Unit tests exercise the parser without any network access.

Context-switch overhead is not currently simulated. CPU efficiency is busy time
divided by total elapsed time (including idle time).
