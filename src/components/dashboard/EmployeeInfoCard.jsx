import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, Building2 } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/utils';

export default function EmployeeInfoCard({ user }) {
  const { data: employeeRecord } = useQuery({
    queryKey: ['employeeRecord', user?.email],
    queryFn: () => base44.entities.Employee.filter({ email: user?.email }).then(data => data[0]),
    enabled: !!user?.email,
  });

  if (!user) return null;

  const name = employeeRecord
    ? `${employeeRecord.first_name} ${employeeRecord.last_name}`.trim()
    : user?.full_name || 'User';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent to-accent/80 text-accent-foreground shadow-lg p-6 flex items-center gap-5 min-h-[120px]">
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-6 -right-4 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

      <Avatar className="w-16 h-16 flex-shrink-0 ring-2 ring-white/30">
        <AvatarImage src={user?.avatar_url} className="object-cover" />
        <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 relative z-10">
        <h3 className="font-bold text-xl leading-tight truncate"><span>{name}</span></h3>
        {employeeRecord?.position && (
          <p className="text-sm font-medium text-accent-foreground/80 mt-0.5"><span>{employeeRecord.position}</span></p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {employeeRecord?.department && (
            <span className="flex items-center gap-1 text-xs text-accent-foreground/70">
              <Building2 className="w-3 h-3" />
              <span>{employeeRecord.department}</span>
            </span>
          )}
          {user?.email && (
            <span className="flex items-center gap-1 text-xs text-accent-foreground/70">
              <Mail className="w-3 h-3" />
              <span>{user.email}</span>
            </span>
          )}
          {employeeRecord?.phone && (
            <span className="flex items-center gap-1 text-xs text-accent-foreground/70">
              <Phone className="w-3 h-3" />
              <span>{formatPhoneNumber(employeeRecord.phone)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}