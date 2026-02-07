import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';

import type { Recipe } from '@/lib/db';
import { recipesCollection, useRecipes } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute('/')({ component: HomeRoute });

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

  const hasRecipes = recipes.length > 0;
  const hasResults = filteredRecipes.length > 0;

  return (
    <>
      <section className="border-b border-border">
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row">
          <Input
            autoFocus
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Filter or name a recipe"
            className="h-24 border-0 px-6 text-4xl font-semibold uppercase tracking-[0.35em] placeholder:text-muted-foreground/70 focus-visible:border-0 focus-visible:ring-0"
          />
          <Button
            type="submit"
            className="h-24 w-full border-t border-border px-8 text-2xl font-semibold uppercase tracking-[0.4em] transition-none sm:w-auto sm:border-l sm:border-t-0"
          >
            Add Recipe
          </Button>
        </form>
      </section>

      <section className="flex flex-col divide-y divide-border">
        {hasResults ? (
          filteredRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              to="/recipes/$recipeId"
              params={{ recipeId: recipe.id }}
              preload="intent"
              className="group flex flex-col bg-background px-6 py-8 text-left transition-colors even:bg-muted/20 hover:bg-muted/60 focus-visible:bg-muted/60"
            >
              <span className="text-3xl font-semibold uppercase tracking-[0.35em]">
                {recipe.name}
              </span>
              <span className="mt-4 text-xs uppercase tracking-[0.5em] text-muted-foreground">
                Portions: {recipe.portionsPrepared}
              </span>
              <span className="text-[0.6rem] uppercase tracking-[0.6em] text-muted-foreground">
                Updated {new Date(recipe.updatedAt).toLocaleDateString()}
              </span>
            </Link>
          ))
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
