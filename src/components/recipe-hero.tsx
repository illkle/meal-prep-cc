import { useCallback } from 'react';

import { Input } from '@/components/ui/input';
import type { Recipe } from '@/lib/db';
import { recipesCollection } from '@/lib/db';
import { XIcon } from 'lucide-react';
import { useLinkedValue } from '@/lib/useDbLinkedValue';

export function RecipeHero({ recipe }: { recipe: Recipe }) {
  const handleNameCommit = useCallback(
    (name: string) => {
      recipesCollection.update(recipe.id, (draft) => {
        draft.name = name;
        draft.updatedAt = new Date().getTime();
      });
    },
    [recipe]
  );

  const handlePortionsCommit = useCallback(
    (portions: string, timestamp: number) => {
      recipesCollection.update(recipe.id, (draft) => {
        draft.portionsPrepared = Number(portions);
        draft.updatedAt = timestamp;
      });
    },
    [recipe]
  );

  const { internalValue, updateHandler } = useLinkedValue({
    value: String(recipe.portionsPrepared),
    onChange: handlePortionsCommit,
    timestamp: recipe.updatedAt,
    validate: (v) => Number.isFinite(Number(v)) && Number(v) > 0,
  });

  return (
    <section className="">
      <div className="flex flex-col  sm:flex-row">
        <div className="flex w-full flex-1 flex-col gap-2">
          <Input
            value={recipe?.name}
            onChange={(event) => handleNameCommit(event.target.value)}
            disabled={!recipe}
            placeholder="Unnamed Recipe"
            styling="largeSearch"
            className=" border-r-0"
          />
        </div>

        <div className="flex flex-col gap-1 sm:w-60 relative">
          <Input
            type="number"
            value={internalValue}
            min={1}
            step={1}
            onChange={(event) => updateHandler(event.target.value)}
            disabled={!recipe}
            className="pl-4"
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
