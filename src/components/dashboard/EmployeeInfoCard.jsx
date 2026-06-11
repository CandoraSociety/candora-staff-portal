import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Briefcase, Calendar, Mail } from 'lucide-react';

export default function EmployeeInfoCard({ user }) {
  const { data: employeeRecord } = useQuery({
    queryKey: ['employeeRecord', user?.email],
    queryFn: () => base44.entities.Employee.filter({ email: user?.email }).then(data => data[0]),
    enabled: !!user?.email,
  });

  if (!employeeRecord) return null;

  return (
    <Card className="bg-gradient-to-br from-card to-accent/5 border-accent/20">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-20 h-20 flex-shrink-0">
            <AvatarImage src={user?.avatar_url} className="object-cover" />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
              {(user?.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-lg text-foreground">{employeeRecord.first_name} {employeeRecord.last_name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{employeeRecord.position}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  {employeeRecord.hire_date ? new Date(employeeRecord.hire_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              {employeeRecord.department && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{employeeRecord.department}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}