import type { NextApiRequest, NextApiResponse } from 'next';
import { runFCFS, runRR } from '../../lib/scheduler';
import { InputError, parseSimulationRequest } from '../../lib/input';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed; use POST.' });
  }

  try {
    const { algorithm, processes, timeQuantum } = parseSimulationRequest(req.body);
    const result = algorithm === 'FCFS'
      ? runFCFS(processes)
      : runRR(processes, timeQuantum!);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof InputError || error instanceof RangeError) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Unexpected simulation failure:', error);
    return res.status(500).json({ error: 'Simulation could not be completed.' });
  }
}
