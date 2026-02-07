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

      <section className="flex flex-col border border-border mt-2">
        {hasResults ? (
          filteredRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              to="/recipes/$recipeId"
              params={{ recipeId: recipe.id }}
              preload="intent"
              className="group flex items-center gap-4 h-12  bg-input/30 px-2 py-2 text-left transition-colors even:bg-muted/20 "
            >
              <span className="uppercase tracking-widest font-semibold text-sm">
                {recipe.name}
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
