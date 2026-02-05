import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';

type SiteHeaderProps = {
  children?: ReactNode;
  className?: string;
};

export function SiteHeader({ children, className }: SiteHeaderProps) {
  return (
    <header className={cn('bg-background text-foreground', className)}>
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
        <Link
          to="/"
          className="text-3xl font-semibold uppercase tracking-[0.4em] text-foreground transition-colors hover:text-primary"
          preload="intent"
        >
          Meal Prep
        </Link>

        <div className="flex items-center gap-4">
          {children ? (
            <div className="text-sm uppercase tracking-widest">{children}</div>
          ) : null}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
