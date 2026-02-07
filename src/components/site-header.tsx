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
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 py-3">
        <div className="flex flex-1 flex-wrap items-center gap-6">
          <Link
            to="/"
            className="text-3xl font-semibold uppercase tracking-[0.4em] text-foreground transition-colors hover:text-primary"
            preload="intent"
          >
            Meal Prep
          </Link>

          <nav className="flex flex-wrap items-center gap-4 text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            <Link
              to="/"
              className="transition-colors hover:text-foreground"
              activeProps={{ className: 'text-primary' }}
              preload="intent"
            >
              Recipes
            </Link>
            <Link
              to="/foods"
              className="transition-colors hover:text-foreground"
              activeProps={{ className: 'text-primary' }}
              preload="intent"
            >
              Foods
            </Link>
          </nav>
        </div>

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
