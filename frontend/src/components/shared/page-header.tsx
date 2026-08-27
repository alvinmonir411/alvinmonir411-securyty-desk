import React from 'react';

interface PageHeaderProps {
  heading: string;
  subheading?: string;
  children?: React.ReactNode;
}

export function PageHeader({ heading, subheading, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{heading}</h1>
        {subheading && <p className="text-sm text-muted-foreground mt-1">{subheading}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
