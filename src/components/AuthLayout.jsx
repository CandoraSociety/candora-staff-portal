import React from "react";
import Candora360Wordmark from "@/components/brand/Candora360Wordmark";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children, brandText, staffLogo = true }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Candora360Wordmark size="lg" staff={staffLogo} className="justify-center mb-4" />
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
          {brandText && (
            <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto leading-relaxed">{brandText}</p>
          )}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}