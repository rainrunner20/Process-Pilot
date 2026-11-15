import test from 'node:test';
import assert from 'node:assert/strict';
import { InputError, parseSimulationRequest, parseWorkload } from '../lib/input.ts';

test('parses Windows line endings, blanks and out-of-order arrivals', () => {
  assert.deepEqual(parseWorkload('2 5 8\r\n\r\n1 0 2\n'), [
    { id: 2, arrivalTime: 5, burstTime: 8 },
    { id: 1, arrivalTime: 0, burstTime: 2 },
  ]);
});

test('rejects invalid and duplicate input without partial output', () => {
  for (const input of [
    '', '1 0', '1 0 2 3', 'abc 0 2', '1 -1 2', '1 1 0',
    '1 1 10001', '0 0 3', '1 0 2\n1 4 2', '1 1 2e5',
  ]) {
    assert.throws(() => parseWorkload(input), InputError, input);
  }
  assert.throws(() => parseWorkload('1 0 2\n2 0 not-a-number'), /Line 2/);
});

test('rejects oversized workloads and unsafe numbers', () => {
  assert.throws(() => parseWorkload('1 0 2\n'.repeat(1001)), InputError);
  assert.throws(() => parseWorkload('1 0 3'.padEnd(64001, ' ')), InputError);
  assert.throws(() => parseWorkload('9007199254740993 0 1'), InputError);
});

test('validates algorithm and quantum at the API boundary', () => {
  const processes = '1 0 5\n2 1 2';
  assert.deepEqual(parseSimulationRequest({ algorithm: 'FCFS', processes }), {
    algorithm: 'FCFS', processes: [{ id: 1, arrivalTime: 0, burstTime: 5 }, { id: 2, arrivalTime: 1, burstTime: 2 }],
  });
  assert.equal(parseSimulationRequest({ algorithm: 'RR', processes, timeQuantum: 2 }).timeQuantum, 2);
  for (const body of [null, [], {}, { algorithm: 'SJF', processes },
    { algorithm: 'RR', processes, timeQuantum: 0 },
    { algorithm: 'RR', processes, timeQuantum: NaN },
    { algorithm: 'RR', processes, timeQuantum: '2' }]) {
    assert.throws(() => parseSimulationRequest(body), InputError);
  }
});
