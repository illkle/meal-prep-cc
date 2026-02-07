import { useMemo, useState } from 'react';

import { createFileRoute, Link } from '@tanstack/react-router';

import { FoodsTable } from '@/components/foods-table';
import { Input } from '@/components/ui/input';
import { useFoodItems } from '@/lib/db';

export const Route = createFileRoute('/foods')({
  component: FoodsRoute,
});

function FoodsRoute() {
  const [query, setQuery] = useState('');
  const { data: foods = [] } = useFoodItems();

  const filteredFoods = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return foods;
    }

    return foods.filter((food) => food.name.toLowerCase().includes(normalized));
  }, [foods, query]);

  const hasFoods = foods.length > 0;
  const hasResults = filteredFoods.length > 0;

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-border py-6">
        <div className="flex flex-1 flex-col">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter foods"
            className="h-16 w-full border-0 px-4 text-3xl font-semibold uppercase tracking-[0.35em] placeholder:text-muted-foreground/70 focus-visible:border-0 focus-visible:ring-0"
          />
          <p className="mt-2 text-[0.6rem] uppercase tracking-[0.4em] text-muted-foreground">
            Edit macros for any ingredient in one place
          </p>
        </div>
        <Link
          to="/"
          className="hidden shrink-0 border border-border px-4 py-3 text-[0.55rem] font-semibold uppercase tracking-[0.35em] transition-colors hover:bg-muted/40 sm:inline-flex"
        >
          Back to recipes
        </Link>
      </div>

      <section className="mt-8 flex-1">
        {hasResults ? (
          <FoodsTable foods={filteredFoods} />
        ) : (
          <div className="px-4 py-10 text-center text-xs uppercase tracking-[0.35em] text-muted-foreground">
            {hasFoods
              ? `No foods matching "${query.trim()}"`
              : 'No foods yet. Create ingredients from any recipe to get started.'}
          </div>
        )}
      </section>
    </>
  );
}
