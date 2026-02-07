import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';

import { formatMacroValue, macroFormatter } from '@/lib/macro-formatters';
import type { MacroTotals, Recipe } from '@/lib/db';
import {
  macroKeys,
  recipeIngredientsCollection,
  recipesCollection,
  useFoodsInRecipe,
  useRecipeNutrition,
  useRecipes,
} from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableRowDeleteButton } from '@/components/table-editable-cells';

export const Route = createFileRoute('/')({ component: HomeRoute });

const macroColumnLabels: Record<keyof MacroTotals, string> = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
};

function HomeRoute() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { data: recipes = [] } = useRecipes();

  const filteredRecipes = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    const getSortKey = (recipe: Recipe) =>
      recipe.updatedAt ?? recipe.createdAt ?? '';

    return [...recipes]
      .filter((recipe) =>
        normalized ? recipe.name.toLowerCase().includes(normalized) : true
      )
      .sort((a, b) => getSortKey(b).localeCompare(getSortKey(a)));
  }, [recipes, searchTerm]);

  const handleCreateRecipe = () => {
    const now = new Date().toISOString();
    const baseName = searchTerm.trim();
    const newRecipe: Recipe = {
      id: crypto.randomUUID(),
      name: baseName.length ? baseName : 'Untitled Recipe',
      portionsPrepared: 1,
      createdAt: now,
      updatedAt: now,
    };

    recipesCollection.insert(newRecipe);

    navigate({
      to: '/recipes/$recipeId',
      params: { recipeId: newRecipe.id },
    });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleCreateRecipe();
  };

  const handleDeleteRecipe = (recipeId: string) => {
    const ingredientIds = Array.from(recipeIngredientsCollection.values())
      .filter((ingredient) => ingredient.recipeId === recipeId)
      .map((ingredient) => ingredient.id);

    if (ingredientIds.length) {
      recipeIngredientsCollection.delete(ingredientIds);
    }

    recipesCollection.delete(recipeId);
  };

  const hasRecipes = recipes.length > 0;
  const hasResults = filteredRecipes.length > 0;

  return (
    <>
      <section className="">
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row">
          <Input
            autoFocus
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Filter or name a recipe"
            styling="largeSearch"
            className="border-r-0"
          />
          <Button
            type="submit"
            variant={'outline'}
            className="w-full h-14  border-border px-8 font-semibold uppercase tracking-[0.4em] transition-none sm:w-auto sm:border-l "
          >
            Create New
          </Button>
        </form>
      </section>

      <section className="flex flex-col mt-2 border border-border ">
        {hasResults ? (
          <>
            <div className="hidden items-center gap-2  bg-muted/40 px-3 py-2 text-[0.55rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:grid sm:grid-cols-[minmax(0,2.2fr)_minmax(80px,0.8fr)_repeat(4,minmax(64px,1fr))_40px]">
              <span>Recipe</span>
              <span>Portions</span>
              {macroKeys.map((key) => (
                <span key={key}>{macroColumnLabels[key]}</span>
              ))}
              <span />
            </div>

            {filteredRecipes.map((recipe) => (
              <RecipeNutritionRow
                key={recipe.id}
                recipe={recipe}
                onDelete={handleDeleteRecipe}
              />
            ))}
          </>
        ) : (
          <div className="px-6 py-20 text-center text-2xl font-semibold uppercase tracking-[0.5em] text-muted-foreground">
            {hasRecipes
              ? `No matches for "${searchTerm.trim()}"`
              : 'No recipes yet. Add one above.'}
          </div>
        )}
      </section>
    </>
  );
}

function RecipeNutritionRow({
  recipe,
  onDelete,
}: {
  recipe: Recipe;
  onDelete: (recipeId: string) => void;
}) {
  const foodsInRecipeQuery = useFoodsInRecipe(recipe.id);
  const nutrition = useRecipeNutrition(
    foodsInRecipeQuery.data,
    recipe.portionsPrepared
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_40px] items-stretch border-b border-border last:border-b-0 bg-input/30 even:bg-muted/20 hover:bg-muted/40">
      <Link
        to="/recipes/$recipeId"
        params={{ recipeId: recipe.id }}
        preload="intent"
        className="grid grid-cols-2 gap-2 px-3 py-3 text-left sm:grid-cols-[minmax(0,2.2fr)_minmax(80px,0.8fr)_repeat(4,minmax(64px,1fr))] sm:items-center sm:gap-3 sm:py-2"
      >
        <div className="col-span-2 min-w-0 sm:col-span-1">
          <p className="truncate text-sm font-semibold uppercase tracking-[0.2em]">
            {recipe.name}
          </p>
        </div>

        <MacroCell
          label="Portions"
          value={macroFormatter.format(recipe.portionsPrepared)}
        />

        {macroKeys.map((key) => (
          <MacroCell
            key={key}
            label={macroColumnLabels[key]}
            value={formatMacroValue(key, nutrition.perPortion[key])}
          />
        ))}
      </Link>

      <TableRowDeleteButton
        onDelete={() => onDelete(recipe.id)}
        ariaLabel="Remove recipe"
      />
    </div>
  );
}

function MacroCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground sm:hidden">
        {label}
      </p>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] sm:text-[0.7rem]">
        {value}
      </p>
    </div>
  );
}
