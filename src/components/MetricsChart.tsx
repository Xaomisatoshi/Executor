import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DecisionRecord } from '../types';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#000B1E] border border-zinc-700 p-3 rounded-md shadow-xl text-[11px] font-mono">
        <p className="text-zinc-400 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="mb-2">
            <p style={{ color: entry.color }} className="font-bold">
              {entry.name}: {entry.value}%
            </p>
            <p className="text-zinc-500 mt-0.5">
              {entry.dataKey === 'acceptance' 
                ? 'Significance: Measures the ratio of accepted decisions to total decisions. High values indicate strong alignment with system thresholds.'
                : 'Significance: Tracks the percentage of decisions exhibiting data drift. Elevated levels trigger automated safety guardrails.'}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const MetricsChart = ({ logs }: { logs: DecisionRecord[] }) => {
  const data = useMemo(() => {
    // Group logs by time (e.g., last 10 entries)
    const recentLogs = [...logs].reverse().slice(-10);
    
    return recentLogs.map((log, index) => {
      const total = index + 1;
      const acceptance = recentLogs.slice(0, index + 1).filter(r => r.action === 'accept').length / total;
      const driftRate = recentLogs.slice(0, index + 1).filter(r => r.drift).length / total;
      
      return {
        time: new Date(log.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        acceptance: parseFloat((acceptance * 100).toFixed(1)),
        driftRate: parseFloat((driftRate * 100).toFixed(1)),
      };
    });
  }, [logs]);

  return (
    <div className="h-64 w-full bg-[#000B1E] p-4 rounded-lg border border-zinc-800">
      <h3 className="text-zinc-400 font-mono text-xs uppercase mb-4">System Performance Metrics</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="time" stroke="#666" fontSize={10} />
          <YAxis stroke="#666" fontSize={10} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          <Line type="monotone" dataKey="acceptance" name="Acceptance %" stroke="#3B82F6" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="driftRate" name="Drift %" stroke="#F43F5E" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
