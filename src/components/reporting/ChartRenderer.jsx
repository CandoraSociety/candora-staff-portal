import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import TableRenderer from './TableRenderer';

const COLORS = ['#1a2744', '#c8952e', '#2d5f8a', '#8b4513', '#4a7c59', '#7c3aed', '#db2777', '#0891b2'];

export default function ChartRenderer({ chartConfig, isPrint }) {
  if (!chartConfig) return null;

  let config;
  try {
    config = typeof chartConfig === 'string' ? JSON.parse(chartConfig) : chartConfig;
  } catch { return null; }

  const { chart_type, title, x_label, y_label, data } = config;
  if (!data || !data.length) return null;

  const renderChart = () => {
    switch (chart_type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} label={x_label ? { value: x_label, position: 'bottom', offset: -5 } : undefined} />
            <YAxis tick={{ fontSize: 12 }} label={y_label ? { value: y_label, angle: -90, position: 'left' } : undefined} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#1a2744" strokeWidth={2} dot={{ fill: '#c8952e', r: 4 }} />
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isPrint ? 80 : 100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#1a2744" fill="#1a2744" fillOpacity={0.15} />
          </AreaChart>
        );
      case 'stacked_bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" stackId="a" fill="#1a2744" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'table':
        return <TableRenderer chartConfig={config} isPrint={isPrint} />;
      default:
        return <p className="text-sm text-muted-foreground">Unsupported chart type: {chart_type}</p>;
    }
  };

  return (
    <div className="my-4">
      {title && <h4 className="text-sm font-semibold text-center mb-2">{title}</h4>}
      {chart_type === 'table' ? renderChart() : (
        <ResponsiveContainer width="100%" height={isPrint ? 220 : 260}>
          {renderChart()}
        </ResponsiveContainer>
      )}
    </div>
  );
}