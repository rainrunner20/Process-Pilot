import test from 'node:test';
import assert from 'node:assert/strict';
import { runFCFS, runRR } from '../lib/scheduler.ts';

test('FCFS respects arrival times and preserves caller input', () => {
  const input = [
    { id: 2, arrivalTime: 1, burstTime: 2 },
    { id: 1, arrivalTime: 0, burstTime: 3 },
  ];
  const snapshot = structuredClone(input);
  const result = runFCFS(input);
  assert.deepEqual(input, snapshot);
  assert.deepEqual(result.processes.map(({ id, startTime, endTime }) => [id, startTime, endTime]), [
    [1, 0, 3], [2, 3, 5],
  ]);
  assert.equal(result.avgWaitingTime, 1);
  assert.equal(result.cpuEfficiency, 100);
});

test('FCFS counts idle time in CPU utilization', () => {
  const result = runFCFS([{ id: 1, arrivalTime: 5, burstTime: 3 }]);
  assert.equal(result.totalTime, 8);
  assert.equal(result.avgResponseTime, 0);
  assert.equal(result.cpuEfficiency, 37.5);
});

test('RR places arrivals during a time slice ahead of requeued process', () => {
  const result = runRR([
    { id: 1, arrivalTime: 0, burstTime: 5 },
    { id: 2, arrivalTime: 1, burstTime: 2 },
  ], 2);
  assert.deepEqual(result.processes.map(({ id, startTime, endTime }) => [id, startTime, endTime]), [
    [1, 0, 7], [2, 2, 4],
  ]);
  assert.equal(result.avgWaitingTime, 1.5);
  assert.equal(result.avgResponseTime, 0.5);
});

test('RR handles idle CPU and a quantum exceeding every burst', () => {
  const result = runRR([
    { id: 2, arrivalTime: 10, burstTime: 2 },
    { id: 1, arrivalTime: 5, burstTime: 1 },
  ], 10);
  assert.equal(result.totalTime, 12);
  assert.equal(result.cpuEfficiency, 25);
  assert.deepEqual(result.processes.map(({ id, endTime }) => [id, endTime]), [[1, 6], [2, 12]]);
});

test('rejects invalid workloads and quantum instead of looping or returning NaN', () => {
  assert.throws(() => runFCFS([]), /at least one/);
  assert.throws(() => runFCFS([{ id: 1, arrivalTime: -1, burstTime: 2 }]), /Arrival/);
  assert.throws(() => runFCFS([{ id: 1, arrivalTime: 0, burstTime: 0 }]), /Burst/);
  assert.throws(() => runFCFS([
    { id: 1, arrivalTime: 0, burstTime: 2 },
    { id: 1, arrivalTime: 2, burstTime: 2 },
  ]), /unique/);
  assert.throws(() => runRR([{ id: 1, arrivalTime: 0, burstTime: 2 }], 0), /quantum/);
  assert.throws(() => runRR([{ id: 1, arrivalTime: 0, burstTime: 2 }], Number.NaN), /quantum/);
});
