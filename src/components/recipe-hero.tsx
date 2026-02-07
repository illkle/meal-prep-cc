import { useCallback } from 'react';

import { Input } from '@/components/ui/input';
import type { Recipe } from '@/lib/db';
import { recipesCollection } from '@/lib/db';
import { XIcon } from 'lucide-react';

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
      <div className="flex flex-col  sm:flex-row">
        <div className="flex w-full flex-1 flex-col gap-2">
          <Input
            value={recipe?.name ?? ''}
            onChange={(event) => handleNameCommit(event.target.value)}
            disabled={!recipe}
            styling="largeSearch"
            className=" border-r-0"
          />
        </div>

        <div className="flex flex-col gap-1 sm:w-60 relative">
          <Input
            type="number"
            value={recipe?.portionsPrepared ?? 1}
            min={1}
            step={1}
            onChange={(event) =>
              handlePortionsCommit(Number(event.target.value))
            }
            disabled={!recipe}
            styling="largeSearch"
          />
          <span className="text-sm  text-muted-foreground absolute left-1 top-[calc(50%+1px)] -translate-y-1/2 z-2">
            <XIcon size={10} />
          </span>
        </div>
      </div>
    </section>
  );
}
