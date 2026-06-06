import React from 'react';
import { Sparkles } from 'lucide-react';

export default function WelcomeWidget({ user }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user?.full_name || 'there').split(' ')[0];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-primary-foreground relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 opacity-80" />
          <span className="text-xs font-medium opacity-80 uppercase tracking-wider">Staff Portal</span>
        </div>
        <h1 className="text-2xl font-display font-bold mt-2">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm opacity-80 mt-1">
          Welcome to the Candora Staff Portal. Access your tools and resources below.
        </p>
      </div>
    </div>
  );
}