import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Sun, 
  Car, 
  DollarSign, 
  AlertCircle, 
  Loader2, 
  Flame, 
  Battery, 
  Activity 
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
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

        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        const data = await response.json();
        if (data.success) {
          setResults(data);
        } else {
          throw new Error(data.message || "Optimization failed.");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Connection failed:", err);
          setError("Failed to connect to the optimizer server.");
        }
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => fetchOptimization(), 300);
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [inputs]);

  // Map results to standard structure with icons and distinct modern colors
  const dispatchData = results
    ? [
        { id: "grid", name: "Grid Power", value: results.dispatch.grid, color: "#f43f5e", icon: <Activity size={20} /> },   
        { id: "diesel", name: "Diesel Gen", value: results.dispatch.diesel, color: "#f97316", icon: <Flame size={20} /> },      
        { id: "battery", name: "Battery", value: results.dispatch.battery, color: "#10b981", icon: <Battery size={20} /> },   
        { id: "ev", name: "EV V2H", value: results.dispatch.ev, color: "#6366f1", icon: <Car size={20} /> },             
      ]
    : [];

  const totalDispatched = dispatchData.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-300 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-neutral-800/80">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-neutral-100">
              Hybrid Energy Management System
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Real-time constrained optimization</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-4 py-2 rounded-lg text-sm border border-rose-500/20">
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT PANEL: Inputs (Col Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#111] border border-[#222] rounded-3xl p-6 relative overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Parameters</h2>
                {isLoading && <Loader2 size={16} className="animate-spin text-neutral-500" />}
              </div>

              <div className="space-y-8 relative z-10">
                <SliderControl
                  label="Target Load"
                  icon={<Zap size={16} />}
                  value={inputs.load}
                  unit="kW"
                  min={10} max={100}
                  onChange={(v) => setInputs({ ...inputs, load: v })}
                />
                <SliderControl
                  label="Solar Yield"
                  icon={<Sun size={16} />}
                  value={inputs.pv}
                  unit="kW"
                  min={0} max={50}
                  onChange={(v) => setInputs({ ...inputs, pv: v })}
                />
                <SliderControl
                  label="Grid Tariff"
                  icon={<DollarSign size={16} />}
                  value={inputs.grid_price}
                  unit="/kWh"
                  step={0.01}
                  min={0.05} max={0.8}
                  onChange={(v) => setInputs({ ...inputs, grid_price: v })}
                />

                {/* EV Status Segmented Control */}
                <div className="pt-4 border-t border-[#222]">
                  <div className="space-y-3">
                    <span className="text-sm font-medium flex items-center gap-2 text-neutral-400">
                      <Car size={16} /> Vehicle Status
                    </span>
                    <div className="flex bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-1">
                      <button
                        onClick={() => setInputs({ ...inputs, ev_at_home: true })}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-200 ${
                          inputs.ev_at_home 
                            ? "bg-[#2a2a2a] text-indigo-400 shadow-sm" 
                            : "text-neutral-500 hover:text-neutral-300"
                        }`}
                      >
                        At Home
                      </button>
                      <button
                        onClick={() => setInputs({ ...inputs, ev_at_home: false })}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-200 ${
                          !inputs.ev_at_home 
                            ? "bg-[#2a2a2a] text-neutral-200 shadow-sm" 
                            : "text-neutral-500 hover:text-neutral-300"
                        }`}
                      >
                        Away
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Outputs (Col Span 8) */}
          <div className={`lg:col-span-8 flex flex-col gap-6 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
            
            {/* Top Row: Total Cost & Bar Chart */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Cost Card */}
              <div className="md:col-span-1 bg-[#111] border border-[#222] rounded-3xl p-6 flex flex-col justify-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">Net Hourly Cost</p>
                <p className="text-4xl font-light text-neutral-100 tracking-tight">
                  <span className="text-neutral-500">$</span>
                  {results?.total_cost?.toFixed(2) || "0.00"}
                </p>
              </div>

              {/* Bar Chart Card */}
              <div className="md:col-span-2 bg-[#111] border border-[#222] rounded-3xl p-6 flex flex-col justify-center gap-4 min-h-[220px]">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Energy Dispatch Profile</p>
                  <p className="text-sm text-neutral-400 font-mono">{totalDispatched.toFixed(1)} kW Total</p>
                </div>
                
                {/* Recharts BarChart */}
                <div className="w-full h-[140px]">
                  {totalDispatched > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dispatchData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#737373', fontSize: 11, fontWeight: 500 }} 
                          dy={5}
                        />
                        <YAxis hide={true} />
                        <Tooltip
                          cursor={{ fill: "#1a1a1a", radius: 4 }}
                          contentStyle={{
                            backgroundColor: "#111",
                            border: "1px solid #2a2a2a",
                            borderRadius: "12px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                            color: "#f5f5f5"
                          }}
                          itemStyle={{ color: "#d4d4d4", fontWeight: "bold" }}
                          formatter={(value) => [`${value.toFixed(2)} kW`, 'Dispatched']}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                          {dispatchData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-neutral-600 border border-dashed border-[#222] rounded-xl">
                      Awaiting Data
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row: 2x2 Detail Cards */}
            <div className="grid grid-cols-2 gap-6 flex-1">
              {dispatchData.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-[#111] border border-[#222] rounded-3xl p-6 flex flex-col justify-between group hover:border-neutral-700 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="p-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-neutral-400 group-hover:text-neutral-200 transition-colors" style={{ color: item.value > 0 ? item.color : undefined }}>
                      {item.icon}
                    </div>
                    {item.value > 0 && (
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-8">
                    <p className="text-neutral-500 text-sm font-medium mb-1">{item.name}</p>
                    <p className="text-3xl font-light text-neutral-100 flex items-baseline gap-1">
                      {item.value?.toFixed(2) || "0.00"}
                      <span className="text-sm font-medium text-neutral-600">kW</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Minimalist Slider Component
function SliderControl({ label, icon, value, min, max, step = 1, unit, onChange }) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-neutral-400 flex items-center gap-2">
          {icon} {label}
        </label>
        <span className="text-sm text-neutral-200 font-mono bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-1 rounded-md">
          {value} <span className="text-neutral-500 text-xs">{unit}</span>
        </span>
      </div>
      
      {/* Custom styled range input */}
      <div className="relative w-full h-2 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
        <div 
          className="absolute top-0 left-0 h-full bg-neutral-600 rounded-full pointer-events-none" 
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div 
          className="absolute top-1/2 -mt-2 h-4 w-4 rounded-full bg-white border-2 border-neutral-800 shadow pointer-events-none"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
}