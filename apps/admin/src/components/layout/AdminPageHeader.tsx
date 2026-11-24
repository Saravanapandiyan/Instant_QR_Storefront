import React from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  children,
}: AdminPageHeaderProps) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-6 border-b transition-colors"
      style={{ borderColor: 'var(--adm-border)' }}
    >
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: 'var(--adm-text)' }}
        >
          {title}
        </h1>

        {description && (
          <p
            className="text-xs mt-1 max-w-2xl"
            style={{ color: 'var(--adm-muted)' }}
          >
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
