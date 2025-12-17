import React, { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface ChartData {
  type: 'bar' | 'line' | 'area' | 'pie';
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  data: { name: string; value: number }[];
}

const COLORS = ['#4f46e5', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export const ChartRenderer: React.FC<{ code: string }> = ({ code }) => {
  const chartData = useMemo(() => {
    try {
      // Clean up the code string just in case
      const cleanCode = code.trim();
      return JSON.parse(cleanCode) as ChartData;
    } catch (e) {
      return null;
    }
  }, [code]);

  if (!chartData) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl my-4 text-slate-500 gap-3">
        <Loader2 className="animate-spin text-primary" size={24} />
        <span className="text-sm font-medium">Generating visualization...</span>
      </div>
    );
  }

  const renderChart = () => {
    switch (chartData.type) {
      case 'line':
        return (
          <LineChart data={chartData.data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 6 }} name={chartData.yAxisLabel || "Value"} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={chartData.data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="#e0e7ff" strokeWidth={3} name={chartData.yAxisLabel || "Value"} />
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData.data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend />
          </PieChart>
        );
      case 'bar':
      default:
        return (
          <BarChart data={chartData.data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend />
            <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} name={chartData.yAxisLabel || "Value"} />
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 my-4 shadow-sm">
      {chartData.title && <h3 className="text-sm font-semibold text-slate-700 mb-6 text-center">{chartData.title}</h3>}
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      {(chartData.xAxisLabel || chartData.yAxisLabel) && (
        <div className="flex justify-between text-xs text-slate-400 mt-2 px-4">
            <span>{chartData.xAxisLabel}</span>
            <span>{chartData.yAxisLabel}</span>
        </div>
      )}
    </div>
  );
};
