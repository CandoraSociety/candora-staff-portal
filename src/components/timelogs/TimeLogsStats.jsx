import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, Calendar } from 'lucide-react';
import moment from 'moment';

export default function TimeLogsStats({ timeLogs }) {
  const stats = useMemo(() => {
    const now = moment();
    const currentYear = now.year();
    const fiscalYearStart = moment(`${currentYear}-04-01`);
    const fiscalYearEnd = moment(`${currentYear + 1}-03-31`);
    
    // All-time total
    const allTimeTotal = timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);

    // Calendar year-to-date
    const cytdLogs = timeLogs.filter(log => {
      const logDate = moment(log.date || log.sign_in_time);
      return logDate.year() === currentYear && log.total_hours;
    });
    const cytdTotal = cytdLogs.reduce((sum, log) => sum + log.total_hours, 0);

    // Fiscal year-to-date (Apr 1 - Mar 31)
    const fytdLogs = timeLogs.filter(log => {
      const logDate = moment(log.date || log.sign_in_time);
      return logDate.isBetween(fiscalYearStart, fiscalYearEnd, 'day', '[]') && log.total_hours;
    });
    const fytdTotal = fytdLogs.reduce((sum, log) => sum + log.total_hours, 0);

    // Currently signed in
    const signedInCount = timeLogs.filter(log => log.status === 'signed_in').length;

    // Hours today
    const todayLogs = timeLogs.filter(log => {
      const logDate = moment(log.date || log.sign_in_time);
      return logDate.isSame(now, 'day');
    });
    const hoursToday = todayLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);

    // Total entries
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Currently Signed In</CardTitle>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.signedInCount}</div>
          <p className="text-xs text-muted-foreground">volunteers active now</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hours Today</CardTitle>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.hoursToday}</div>
          <p className="text-xs text-muted-foreground">logged today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalEntries}</div>
          <p className="text-xs text-muted-foreground">all time logs</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">All-Time Total</CardTitle>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.allTimeTotal}h</div>
          <p className="text-xs text-muted-foreground">total hours logged</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Calendar YTD</CardTitle>
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.cytdTotal}h</div>
          <p className="text-xs text-muted-foreground">Jan 1 - Dec 31</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fiscal YTD</CardTitle>
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.fytdTotal}h</div>
          <p className="text-xs text-muted-foreground">Apr 1 - Mar 31</p>
        </CardContent>
      </Card>
    </div>
  );
}