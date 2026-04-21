import React, { useState, useEffect } from "react";
import { Zap, Sun, Wind, Car, DollarSign, AlertCircle, Loader2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function EnergyDashboard() {
  const [inputs, setInputs] = useState({
    load: 35,
    pv: 10,
    wind: 15,
    grid_price: 0.15,
    ev_at_home: true,
  });

  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchOptimization = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
        const response = await fetch(`${API_BASE}/api/optimize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputs),
          signal,
        });

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setResults(data);
        } else {
          throw new Error(data.message || "Optimization failed on server.");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Connection failed:", err);
          setError("Failed to connect to the optimizer. Ensure the Python server is running.");
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      fetchOptimization();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [inputs]);

  const chartData = results
    ? [
        { name: "Grid", value: results.dispatch.grid, color: "#f87171" },
        { name: "Diesel", value: results.dispatch.diesel, color: "#fbbf24" },
        { name: "Battery", value: results.dispatch.battery, color: "#34d399" },
        { name: "EV", value: results.dispatch.ev, color: "#60a5fa" },
      ]
    : [];

  // Calculate total dispatch to scale the progress bars correctly
  const totalDispatched = chartData.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300 p-6 md:p-12 font-sans selection:bg-blue-500/30 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-10 border-b border-slate-800/80 pb-6 shrink-0">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-sm">
            Hybrid Energy Management System Optimizer
          </h1>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-xl flex items-center gap-3 border border-red-500/20 backdrop-blur-sm shrink-0">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
          {/* Controls Section (Left Column) */}
          <div className="lg:col-span-4 xl:col-span-3 bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-slate-800/60 space-y-6 self-start relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="flex justify-between items-center relative z-10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Settings
              </h2>
              {isLoading && <Loader2 size={18} className="animate-spin text-blue-400" />}
            </div>

            <div className="space-y-5 relative z-10">
              <InputItem
                id="load-input"
                label="Load (kW)"
                icon={<Zap size={16} />}
                value={inputs.load}
                min={10}
                max={100}
                onChange={(v) => setInputs({ ...inputs, load: v })}
              />

              <InputItem
                id="pv-input"
                label="Solar (kW)"
                icon={<Sun size={16} />}
                value={inputs.pv}
                min={0}
                max={50}
                onChange={(v) => setInputs({ ...inputs, pv: v })}
              />

              <InputItem
                id="grid-price-input"
                label="Grid Price ($)"
                icon={<DollarSign size={16} />}
                value={inputs.grid_price}
                min={0.05}
                max={0.8}
                step={0.01}
                onChange={(v) => setInputs({ ...inputs, grid_price: v })}
              />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 relative z-10">
              <span className="text-sm font-semibold flex items-center gap-2 text-slate-300">
                <Car size={18} className="text-blue-400" /> EV Status
              </span>
              <button
                onClick={() =>
                  setInputs({ ...inputs, ev_at_home: !inputs.ev_at_home })
                }
                className={`px-5 py-1.5 rounded-full text-xs font-extrabold tracking-wide transition-all duration-300 ${
                  inputs.ev_at_home
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                    : "bg-slate-800/50 text-slate-500 border border-slate-700/50"
                }`}
              >
                {inputs.ev_at_home ? "AT HOME" : "AWAY"}
              </button>
            </div>
          </div>

          {/* Visualization Section (Right Column) */}
          <div className={`lg:col-span-8 xl:col-span-9 bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-slate-800/60 relative overflow-hidden transition-all duration-300 flex flex-col ${isLoading ? 'opacity-60 saturate-50' : 'opacity-100'}`}>
            
            {/* Vis Header */}
            <div className="flex justify-between items-start mb-8 shrink-0">
              <h2 className="text-xl font-bold text-white">Energy Mix Breakdown</h2>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                  Total Cost/hr
                </p>
                <p className="text-4xl font-mono text-emerald-400 font-black tracking-tight drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">
                  ${results?.total_cost?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>

            {/* Content Split: Chart & Metrics */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[350px]">
              
              {/* Donut Chart */}
              <div className="h-[280px] w-full relative">
                {results ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          innerRadius="65%"
                          outerRadius="90%"
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                          cornerRadius={4}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          cursor={{ fill: "#1e293b", opacity: 0.4 }}
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.9)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid #334155",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                            color: "#f8fafc"
                          }}
                          itemStyle={{ color: "#e2e8f0", fontWeight: "bold" }}
                          formatter={(value) => [`${value.toFixed(2)} kW`]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Inner Donut Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Load</span>
                      <span className="text-2xl font-mono font-bold text-white mt-1">
                        {totalDispatched.toFixed(1)} <span className="text-sm text-slate-500">kW</span>
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm font-medium border-2 border-dashed border-slate-800/50 rounded-full">
                    {error ? "Data Unavailable" : "Awaiting Data..."}
                  </div>
                )}
              </div>

              {/* Detailed Metrics List */}
              <div className="space-y-4">
                {chartData.map((item) => {
                  const percentage = totalDispatched > 0 ? (item.value / totalDispatched) * 100 : 0;
                  
                  return (
                    <div
                      key={item.name}
                      className="bg-slate-800/30 p-4 rounded-xl border border-slate-800/80 shadow-inner hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex justify-between items-end mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                            {item.name}
                          </span>
                        </div>
                        <p className="text-xl font-mono font-bold text-white flex items-baseline gap-1">
                          {item.value?.toFixed(2) || 0}
                          <span className="text-xs text-slate-500 uppercase">kW</span>
                        </p>
                      </div>
                      
                      {/* Custom Progress Bar */}
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out relative"
                          style={{ 
                            width: `${percentage}%`, 
                            backgroundColor: item.color,
                            boxShadow: `0 0 10px ${item.color}80` 
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono text-right mt-1.5">
                        {percentage.toFixed(1)}% of total
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputItem({ id, label, icon, value, min, max, step = 1, onChange }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2 cursor-pointer hover:text-slate-300 transition-colors">
          <span className="text-slate-500">{icon}</span> {label}
        </label>
        <span className="text-sm font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
          {value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-2 focus:ring-offset-slate-900"
      />
    </div>
  );
}