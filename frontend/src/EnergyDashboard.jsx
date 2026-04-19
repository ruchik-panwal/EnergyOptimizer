import React, { useState, useEffect } from "react";
import { Zap, Sun, Wind, Car, DollarSign } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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

  // Calls your Python backend
  const fetchOptimization = async () => {
  try {
    // 1. Vite uses import.meta.env instead of process.env
    // 2. We add a fallback to localhost:8000 for local development
    const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    
    const response = await fetch(`${API_BASE}/api/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        load: inputs.load,
        pv: inputs.pv,
        wind: inputs.wind,
        grid_price: inputs.grid_price,
        ev_at_home: inputs.ev_at_home,
      }),
    });

    if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      setResults(data);
    }
  } catch (error) {
    console.error("Connection failed. Check if the Python server is running at the correct URL.");
  }
};

  useEffect(() => {
    fetchOptimization();
  }, [inputs]);

  const chartData = results
    ? [
        { name: "Grid", value: results.dispatch.grid, color: "#ef4444" },
        { name: "Diesel", value: results.dispatch.diesel, color: "#f59e0b" },
        { name: "Battery", value: results.dispatch.battery, color: "#10b981" },
        { name: "EV", value: results.dispatch.ev, color: "#3b82f6" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 border-b pb-6">
          <h1 className="text-3xl font-bold text-slate-800">HEMS Optimizer</h1>
          <p className="text-slate-500">
            Unit 5: Constrained Optimization via Lagrange & KKT
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Settings
            </h2>

            <InputItem
              label="Load (kW)"
              icon={<Zap size={16} />}
              value={inputs.load}
              min={10}
              max={100}
              onChange={(v) => setInputs({ ...inputs, load: v })}
            />

            <InputItem
              label="Solar (kW)"
              icon={<Sun size={16} />}
              value={inputs.pv}
              min={0}
              max={50}
              onChange={(v) => setInputs({ ...inputs, pv: v })}
            />

            <InputItem
              label="Grid Price ($)"
              icon={<DollarSign size={16} />}
              value={inputs.grid_price}
              min={0.05}
              max={0.8}
              step={0.01}
              onChange={(v) => setInputs({ ...inputs, grid_price: v })}
            />

            <div className="flex items-center justify-between pt-4">
              <span className="text-sm font-medium flex items-center gap-2 text-slate-600">
                <Car size={18} /> EV Status
              </span>
              <button
                onClick={() =>
                  setInputs({ ...inputs, ev_at_home: !inputs.ev_at_home })
                }
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  inputs.ev_at_home
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {inputs.ev_at_home ? "AT HOME" : "AWAY"}
              </button>
            </div>
          </div>

          {/* Visualization Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Power Dispatch Plan</h2>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">
                    Total Cost/hr
                  </p>
                  <p className="text-2xl font-mono text-emerald-600 font-bold">
                    ${results?.total_cost || "0.00"}
                  </p>
                </div>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      fontSize={12}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      fontSize={12}
                      unit="kW"
                    />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metric Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {chartData.map((item) => (
                <div
                  key={item.name}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
                >
                  <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">
                    {item.name}
                  </p>
                  <p className="text-xl font-mono font-bold">
                    {item.value}{" "}
                    <span className="text-[10px] text-slate-400 uppercase">
                      kW
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputItem({ label, icon, value, min, max, step = 1, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
          {icon} {label}
        </label>
        <span className="text-sm font-mono font-bold text-slate-800">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
}
