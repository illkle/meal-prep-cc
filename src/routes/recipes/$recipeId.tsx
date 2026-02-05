import { useMemo, useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { SiteHeader } from '@/components/site-header';
import { RecipeMacroSummary } from '@/components/recipe-macro-summary';
import { useFoodsInRecipe, useFoodItems, useRecipe } from '@/lib/db';

import { RecipeHero } from '@/components/recipe-hero';
import { IngredientsTable } from '@/components/ingredients-table';
import { AddIngredientButton } from '@/components/add-ingredient-button';
import { Input } from '@/components/ui/input';
import type { FoodItem } from '@/lib/db';

export const Route = createFileRoute('/recipes/$recipeId')({
  component: RecipePage,
});

function RecipePage() {
  const { recipeId } = Route.useParams();
  const recipeQuery = useRecipe(recipeId);
  const foodsInRecipeQuery = useFoodsInRecipe(recipeId);
  const foodsQuery = useFoodItems();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);

  const foods = foodsQuery.data ?? [];
  const matches = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return [];
    return foods
      .filter((food) => food.name.toLowerCase().includes(normalized))
      .slice(0, 6);
  }, [foods, searchQuery]);

  const handleQueryChange = (value: string) => {
    setSearchQuery(value);
    setSelectedFoodId(null);
  };

  const handleFoodSelect = (food: FoodItem) => {
    setSearchQuery(food.name);
    setSelectedFoodId(food.id);
  };

  const handleAfterAdd = () => {
    setSearchQuery('');
    setSelectedFoodId(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-16">
        {recipeQuery.data ? <RecipeHero recipe={recipeQuery.data} /> : null}

        <RecipeMacroSummary
          foodsInRecipeQuery={foodsInRecipeQuery}
          portions={recipeQuery.data?.portionsPrepared ?? 1}
        />

        <section className="flex flex-1 flex-col">
          <div className="mt-6 ">
            <IngredientsTable recipeId={recipeId} />
          </div>

          <div className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <IngredientSearchField
                query={searchQuery}
                matches={matches}
                onQueryChange={handleQueryChange}
                onFoodSelect={handleFoodSelect}
                isLoading={foodsQuery.isLoading}
              />
              <AddIngredientButton
                recipeId={recipeId}
                selectedFoodId={selectedFoodId}
                pendingFoodName={searchQuery}
                onAfterAdd={handleAfterAdd}
                className="w-full shrink-0 sm:w-auto sm:min-w-[190px]"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function IngredientSearchField({
  query,
  matches,
  onQueryChange,
  onFoodSelect,
  isLoading,
}: {
  query: string;
  matches: Array<FoodItem>;
  onQueryChange: (value: string) => void;
  onFoodSelect: (food: FoodItem) => void;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);

  const showDropdown = open;

  return (
    <div className="relative flex-1">
      <Input
        value={query}
        onChange={(event) => {
          onQueryChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120);
        }}
        placeholder="Search ingredients"
        aria-label="Search ingredients"
        className="h-12 w-full border border-border px-3 text-sm font-semibold uppercase tracking-[0.3em]"
      />

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-20 border border-border bg-background text-[0.65rem] uppercase tracking-[0.3em] shadow-lg">
          {isLoading ? (
            <div className="px-3 py-2 text-muted-foreground">Searching…</div>
          ) : matches.length ? (
            matches.map((food) => (
              <button
                key={food.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onFoodSelect(food);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[0.55rem] font-semibold uppercase tracking-[0.3em] hover:bg-muted/60"
              >
                {food.name}
              </button>
            ))
          ) : query.trim().length ? (
            <div className="px-3 py-2 text-muted-foreground">
              Press add to create "{query.trim()}"
            </div>
          ) : (
            <div className="px-3 py-2 text-muted-foreground">Type to search</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
