import { useState } from 'react';
import { useRouter } from 'next/router';
import { TextField, MenuItem, Button, Container, Typography, Box, IconButton, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import { FaSpinner, FaMoon, FaSun } from 'react-icons/fa';

const SAMPLE_WORKLOAD = ['1 0 8', '2 1 3', '3 4 6', '4 6 2', '5 9 4'].join('\n');

export default function Home() {
  const [algorithm, setAlgorithm] = useState('FCFS');
  const [processes, setProcesses] = useState(SAMPLE_WORKLOAD);
  const [timeQuantum, setTimeQuantum] = useState('2');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function responseData(response: Response): Promise<Record<string, unknown>> {
    const data: unknown = await response.json().catch(() => ({}));
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error('The server returned an invalid response.');
    }
    const result = data as Record<string, unknown>;
    if (!response.ok) {
      throw new Error(typeof result.error === 'string' ? result.error : 'The request failed.');
    }
    return result;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm, processes, timeQuantum: Number(timeQuantum) }),
      });
      const result = await responseData(response);
      await router.push({ pathname: '/results', query: { results: JSON.stringify(result) } });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Simulation failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const generateAIInput = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/generate-input');
      const data = await responseData(response);
      if (typeof data.processes !== 'string' || !data.processes.trim()) {
        throw new Error('The AI provider returned no usable process list.');
      }
      setProcesses(data.processes);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not generate processes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={darkMode ? 'dark min-h-screen bg-slate-950 text-white' : 'min-h-screen bg-slate-100 text-slate-950'}>
      <div className="bg-retroPurple p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Typography variant="h4" className="font-bold text-white">ProcessPilot</Typography>
          <IconButton aria-label="Toggle dark mode" onClick={() => setDarkMode(!darkMode)} className="text-white">
            {darkMode ? <FaSun /> : <FaMoon />}
          </IconButton>
        </div>
      </div>
      <Container maxWidth="md" className="p-8 mt-8">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Typography variant="h3" className="font-bold mb-3">CPU Scheduler Simulator</Typography>
          <p className="mb-7 text-sm opacity-80">Compare arrival order, waiting time, and CPU utilization with deterministic FCFS or Round Robin simulation.</p>
          <Box component="form" onSubmit={handleSubmit} className="space-y-5">
            {error && <Alert severity="error" role="alert">{error}</Alert>}
            <TextField select label="Algorithm" value={algorithm}
              onChange={(event) => setAlgorithm(event.target.value)} fullWidth variant="outlined"
              className="bg-white rounded">
              <MenuItem value="FCFS">First-Come, First-Served (FCFS)</MenuItem>
              <MenuItem value="RR">Round Robin (RR)</MenuItem>
            </TextField>
            {algorithm === 'RR' && <TextField label="Time Quantum" type="number" value={timeQuantum}
              onChange={(event) => setTimeQuantum(event.target.value)}
              inputProps={{ min: 1, max: 10000, step: 1 }} fullWidth className="bg-white rounded" />}
            <TextField label="Processes (ID Arrival Burst)" value={processes}
              onChange={(event) => setProcesses(event.target.value)} fullWidth multiline rows={8}
              variant="outlined" className="bg-white rounded"
              helperText="One process per line, with three integers. Blank lines are ignored." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button type="button" variant="outlined" disabled={loading} onClick={() => {
                setProcesses(SAMPLE_WORKLOAD);
                setError(null);
              }} className="bg-white">Load sample workload</Button>
              <Button type="button" variant="outlined" disabled={loading}
                onClick={generateAIInput} className="bg-white">Generate AI input (optional)</Button>
            </div>
            <Button type="submit" variant="contained" disabled={loading} fullWidth
              className="bg-blue-700 hover:bg-blue-600">
              {loading ? <><FaSpinner className="animate-spin mr-2" /> Running...</> : 'Run simulation'}
            </Button>
          </Box>
        </motion.div>
      </Container>
    </div>
  );
}
