import { useMemo, useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

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
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter foods"
        className="mb-2"
        styling="largeSearch"
      />

      <section className="flex-1">
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
