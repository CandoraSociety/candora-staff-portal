import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Loader2, ShieldCheck, RefreshCw, Mail } from 'lucide-react';

// Authorizes every active HR staff profile that has an email but no portal
// account yet. Authorizing = sending them an app invitation, which is what
// makes their email address allowed into this private app.
export default function StaffAccessSyncPanel() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');
  const [summary, setSummary] = useState(null);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list('-created_date', 500),
  });

  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const userIds = useMemo(
    () => new Set(users.flatMap((u) => [u.id, (u.email || '').toLowerCase()]).filter(Boolean)),
    [users]
  );

  // Active staff with an email but no portal account yet.
  const withoutAccount = useMemo(
    () =>
      employees.filter(
        (e) =>
          !e.is_deleted &&
          e.status !== 'terminated' &&
          e.email &&
          !userIds.has((e.email || '').toLowerCase()) &&
          !userIds.has(e.user_id)
      ),
    [employees, userIds]
  );

  // Of those, the ones who have never been sent an invitation. An invited person
  // only becomes a portal user once they accept and set a password.
  const pending = useMemo(() => withoutAccount.filter((e) => !e.invite_sent), [withoutAccount]);

  const authorizeAll = async () => {
    setRunning(true);
    setSummary(null);
    let authorized = 0;
    const failed = [];
    for (const emp of pending) {
      setProgress(`${emp.first_name} ${emp.last_name}`);
      try {
        await base44.users.inviteUser(emp.email.trim().toLowerCase(), 'user');
        await base44.entities.Employee.update(emp.id, { invite_sent: true });
        authorized += 1;
      } catch (err) {
        failed.push(`${emp.first_name} ${emp.last_name} — ${err.message || 'could not authorize'}`);
      }
    }
    setProgress('');
    setRunning(false);
    setSummary({ authorized, failed });
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    refetchUsers();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">Authorize staff from their HR profile</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Every active staff member with an email on their HR profile gets an app invitation, so they can create
                their account with that address. Nothing needs to be typed in.
              </p>
            </div>
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              {pending.length} not invited yet
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            An invitation is what grants access to this private app. The staff member appears as “Authorized” once they
            open the email and set their password. {withoutAccount.length} staff are still without an account.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={authorizeAll} disabled={running || pending.length === 0}>
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
              {running ? 'Authorizing…' : pending.length === 0 ? 'Everyone has been invited' : `Authorize all ${pending.length} staff`}
            </Button>
            <Button variant="outline" onClick={() => { refetchUsers(); queryClient.invalidateQueries({ queryKey: ['employees'] }); }} disabled={running}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            {progress && <span className="text-xs text-muted-foreground">Working on {progress}…</span>}
          </div>

          {summary && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
              <p className="font-medium text-foreground">{summary.authorized} invitation{summary.authorized === 1 ? '' : 's'} sent.</p>
              {summary.failed.length > 0 && (
                <ul className="text-xs text-destructive space-y-0.5">
                  {summary.failed.map((line) => <li key={line}>{line}</li>)}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left text-muted-foreground">
                <th className="p-4 font-medium">Staff member</th>
                <th className="p-4 font-medium hidden sm:table-cell">HR email</th>
                <th className="p-4 font-medium">Portal access</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {employees
                .filter((e) => !e.is_deleted && e.status !== 'terminated' && e.email)
                .sort((a, b) => `${a.last_name}`.localeCompare(`${b.last_name}`))
                .map((emp) => {
                  const hasAccess = userIds.has((emp.email || '').toLowerCase()) || userIds.has(emp.user_id);
                  return (
                    <tr key={emp.id} className="hover:bg-muted/20">
                      <td className="p-4">
                        <p className="font-medium">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs text-muted-foreground">{emp.position || emp.department || ''}</p>
                      </td>
                      <td className="p-4 hidden sm:table-cell text-muted-foreground">{emp.email}</td>
                      <td className="p-4">
                        {hasAccess ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" /> Authorized
                          </span>
                        ) : emp.invite_sent ? (
                          <span className="inline-flex items-center gap-1 text-xs text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full" title="An invitation has been sent — they appear as Authorized once they set a password.">
                            <Mail className="w-3 h-3" /> Invited — awaiting sign-up
                          </span>
                        ) : (
                          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Not invited</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              {employees.length === 0 && (
                <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No staff profiles with an email yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}