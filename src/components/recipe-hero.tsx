import { useCallback } from 'react';

import { Input } from '@/components/ui/input';
import type { Recipe } from '@/lib/db';
import { recipesCollection } from '@/lib/db';

export function RecipeHero({ recipe }: { recipe: Recipe }) {
  const handleNameCommit = useCallback(
    (name: string) => {
      const nextName = name.trim();
      if (!nextName || nextName === recipe.name) return;
      const now = new Date().toISOString();
      recipesCollection.update(recipe.id, (draft) => {
        draft.name = nextName;
        draft.updatedAt = now;
      });
    },
    [recipe]
  );

  const handlePortionsCommit = useCallback(
    (portions: number) => {
      const nextValue = Number(portions);
      if (!Number.isFinite(nextValue) || nextValue <= 0) {
        return;
      }
      if (nextValue === recipe.portionsPrepared) return;
      const now = new Date().toISOString();
      recipesCollection.update(recipe.id, (draft) => {
        draft.portionsPrepared = nextValue;
        draft.updatedAt = now;
      });
    },
    [recipe]
  );

  return (
    <section className="">
      <div className="flex flex-col  sm:flex-row ">
        <div className="flex w-full flex-1 flex-col gap-2">
          <label className="text-[0.6rem] uppercase tracking-[0.5em] text-muted-foreground">
            Recipe Name
          </label>
          <Input
            value={recipe?.name ?? ''}
            onChange={(event) => handleNameCommit(event.target.value)}
            disabled={!recipe}
            className="h-14 w-full border border-border bg-transparent px-4 text-3xl font-semibold uppercase tracking-[0.35em]"
          />
        </div>

        <div className="flex flex-col gap-2 sm:w-60">
          <label className="text-[0.6rem] uppercase tracking-[0.5em] text-muted-foreground">
            Portions Prepared
          </label>
          <Input
            type="number"
            value={recipe?.portionsPrepared ?? 1}
            min={1}
            step={1}
            onChange={(event) =>
              handlePortionsCommit(Number(event.target.value))
            }
            disabled={!recipe}
            className="h-14 border border-border border-l-0 px-4 text-3xl font-semibold uppercase tracking-[0.35em]"
          />
        </div>
      </div>
    </section>
  );
}
