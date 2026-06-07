import { useState, useMemo } from 'react';
import moment from 'moment';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Calendar, Award } from 'lucide-react';
import { format } from 'date-fns';

export default function EmployeeHourStats({ timeLogs }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const stats = useMemo(() => {
    const now = moment();
    const calendarYearStart = moment().startOf('year');
    const fiscalYearStart = moment().month(3).date(1).startOf('day'); // April 1
    if (now.isBefore(fiscalYearStart)) {
      fiscalYearStart.subtract(1, 'year');
    }

    const allTime = timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
    const calendarYTD = timeLogs
      .filter(log => moment(log.date || log.sign_in_time).isSameOrAfter(calendarYearStart))
      .reduce((sum, log) => sum + (log.total_hours || 0), 0);
    const fiscalYTD = timeLogs
      .filter(log => moment(log.date || log.sign_in_time).isSameOrAfter(fiscalYearStart))
      .reduce((sum, log) => sum + (log.total_hours || 0), 0);

    // Monthly breakdown for calendar YTD
    const monthlyBreakdown = {};
    timeLogs
      .filter(log => moment(log.date || log.sign_in_time).isSameOrAfter(calendarYearStart))
      .forEach(log => {
        const monthKey = moment(log.date || log.sign_in_time).format('YYYY-MM');
        monthlyBreakdown[monthKey] = (monthlyBreakdown[monthKey] || 0) + (log.total_hours || 0);
      });

    return { allTime, calendarYTD, fiscalYTD, monthlyBreakdown };
  }, [timeLogs]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.allTime.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">All-Time Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent-foreground">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.calendarYTD.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Calendar YTD</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10 text-success-foreground">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.fiscalYTD.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Fiscal YTD</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{timeLogs.length}</p>
                <p className="text-xs text-muted-foreground">Time Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}