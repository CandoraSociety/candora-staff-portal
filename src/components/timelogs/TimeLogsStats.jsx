import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, Calendar } from 'lucide-react';
import moment from 'moment';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COLORS = ["#2d8a6e", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#10b981", "#f97316", "#06b6d4", "#ef4444", "#84cc16", "#6366f1", "#14b8a6", "#d946ef", "#fb923c", "#a3e635"];

export default function TimeLogsStats({ timeLogs }) {
  const [yearFilter, setYearFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  // Extract available years and months from data
  const availableYears = useMemo(() => {
    const years = new Set();
    timeLogs.forEach(log => {
      const date = moment(log.date || log.sign_in_time);
      if (date.isValid()) years.add(date.year());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [timeLogs]);

  const availableMonths = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Filter logs based on selected year and month
  const filteredLogs = useMemo(() => {
    return timeLogs.filter(log => {
      const date = moment(log.date || log.sign_in_time);
      if (!date.isValid()) return false;
      
      if (yearFilter !== 'all' && date.year() !== parseInt(yearFilter)) return false;
      if (monthFilter !== 'all' && (date.month() + 1) !== parseInt(monthFilter)) return false;
      
      return true;
    });
  }, [timeLogs, yearFilter, monthFilter]);

  // Process data for pie chart
  const pieData = useMemo(() => {
    const programHours = {};
    
    filteredLogs.forEach(log => {
      const program = log.position_title || 'General';
      programHours[program] = (programHours[program] || 0) + (log.total_hours || 0);
    });

    // Convert to array and sort by hours descending
    const sorted = Object.entries(programHours)
      .map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 }))
      .sort((a, b) => b.value - a.value);

    // Take top 6, combine rest into "Other"
    if (sorted.length <= 6) {
      return sorted;
    }

    const top6 = sorted.slice(0, 6);
    const other = sorted.slice(6);
    const otherTotal = other.reduce((sum, item) => sum + item.value, 0);
    
    return [
      ...top6,
      { 
        name: 'Other', 
        value: Math.round(otherTotal * 10) / 10,
        otherPrograms: other 
      }
    ];
  }, [filteredLogs]);

  const filteredTotal = useMemo(() => {
    const total = pieData.reduce((sum, item) => sum + item.value, 0);
    return Math.round(total * 10) / 10;
  }, [pieData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, entry }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const percentage = filteredTotal > 0 ? ((data.value / filteredTotal) * 100).toFixed(1) : 0;

    return (
      <div className="bg-white border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="font-semibold text-sm mb-1">{data.name}</p>
        <p className="text-xs text-muted-foreground">
          {percentage}% of total · {data.value}h
        </p>
        
        {data.otherPrograms && data.otherPrograms.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs font-medium mb-1">Includes:</p>
            <div className="space-y-0.5">
              {data.otherPrograms.map((program, idx) => {
                const progPercentage = ((program.value / filteredTotal) * 100).toFixed(1);
                return (
                  <p key={idx} className="text-xs text-muted-foreground">
                    {program.name} — {progPercentage}% · {program.value}h
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Basic stats
  const basicStats = useMemo(() => {
    const now = moment();
    const currentYear = now.year();
    const fiscalYearStart = moment(`${currentYear}-04-01`);
    const fiscalYearEnd = moment(`${currentYear + 1}-03-31`);
    
    // All-time total - sum all logs with valid hours
    const allTimeTotal = timeLogs
      .filter(log => log.total_hours != null && log.total_hours > 0)
      .reduce((sum, log) => sum + log.total_hours, 0);

    // Calendar YTD - current year only
    const cytdLogs = timeLogs.filter(log => {
      const logDate = moment(log.date || log.sign_in_time);
      return logDate.isValid() && logDate.year() === currentYear && log.total_hours != null && log.total_hours > 0;
    });
    const cytdTotal = cytdLogs.reduce((sum, log) => sum + log.total_hours, 0);

    // Fiscal YTD - Apr 1 to Mar 31
    const fytdLogs = timeLogs.filter(log => {
      const logDate = moment(log.date || log.sign_in_time);
      return logDate.isValid() && logDate.isBetween(fiscalYearStart, fiscalYearEnd, 'day', '[]') && log.total_hours != null && log.total_hours > 0;
    });
    const fytdTotal = fytdLogs.reduce((sum, log) => sum + log.total_hours, 0);

    const signedInCount = timeLogs.filter(log => log.status === 'signed_in').length;

    // Hours today
    const todayLogs = timeLogs.filter(log => {
      const logDate = moment(log.date || log.sign_in_time);
      return logDate.isValid() && logDate.isSame(now, 'day') && log.total_hours != null && log.total_hours > 0;
    });
    const hoursToday = todayLogs.reduce((sum, log) => sum + log.total_hours, 0);

    const totalEntries = timeLogs.length;

    return {
      allTimeTotal: Math.round(allTimeTotal * 100) / 100,
      cytdTotal: Math.round(cytdTotal * 100) / 100,
      fytdTotal: Math.round(fytdTotal * 100) / 100,
      signedInCount,
      hoursToday: Math.round(hoursToday * 100) / 100,
      totalEntries
    };
  }, [timeLogs]);

  return (
    <div className="space-y-6">
      {/* Basic Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Signed In</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{basicStats.signedInCount}</div>
            <p className="text-xs text-muted-foreground">volunteers active now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Today</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{basicStats.hoursToday}</div>
            <p className="text-xs text-muted-foreground">logged today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{basicStats.totalEntries}</div>
            <p className="text-xs text-muted-foreground">all time logs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All-Time Total</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{basicStats.allTimeTotal}h</div>
            <p className="text-xs text-muted-foreground">total hours logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calendar YTD</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{basicStats.cytdTotal}h</div>
            <p className="text-xs text-muted-foreground">Jan 1 - Dec 31</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fiscal YTD</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{basicStats.fytdTotal}h</div>
            <p className="text-xs text-muted-foreground">Apr 1 - Mar 31</p>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Hours by Program Area</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredTotal.toFixed(1)} hours total in selection
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {availableMonths.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <div className="h-[380px] flex items-center justify-center text-muted-foreground">
              <p>No data for selected period.</p>
            </div>
          ) : (
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="42%"
                    outerRadius="55%"
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    formatter={(value) => (
                      <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}