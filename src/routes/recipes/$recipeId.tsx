import { createFileRoute } from '@tanstack/react-router';

import { RecipeMacroSummary } from '@/components/recipe-macro-summary';
import { useFoodsInRecipe, useRecipe } from '@/lib/db';

import { RecipeHero } from '@/components/recipe-hero';
import { IngredientsTable } from '@/components/ingredients-table';
import { IngredientLibrarySearch } from '@/components/add-ingredient';

export const Route = createFileRoute('/recipes/$recipeId')({
  component: RecipePage,
});

function RecipePage() {
  const { recipeId } = Route.useParams();
  const recipeQuery = useRecipe(recipeId);
  const foodsInRecipeQuery = useFoodsInRecipe(recipeId);

  return (
    <>
      {recipeQuery.data ? <RecipeHero recipe={recipeQuery.data} /> : null}

      <RecipeMacroSummary
        foodsInRecipeQuery={foodsInRecipeQuery}
        portions={recipeQuery.data?.portionsPrepared ?? 1}
      />

      <section className="flex flex-1 flex-col gap-2 mt-2">
        <div className="flex items-center">
          <IngredientLibrarySearch recipeId={recipeId} className="w-full" />
        </div>

        <IngredientsTable recipeId={recipeId} />
      </section>
    </>
  );
}
