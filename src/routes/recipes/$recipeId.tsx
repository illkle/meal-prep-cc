import { createFileRoute } from '@tanstack/react-router';

import { RecipeMacroSummary } from '@/components/recipe-macro-summary';
import { useFoodsInRecipe, useRecipe } from '@/lib/db';

import { RecipeHero } from '@/components/recipe-hero';
import { IngredientsTable } from '@/components/ingredients-table';
import { AddIngredientButton } from '@/components/add-ingredient-button';

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

      <section className="flex flex-1 flex-col">
        <div className="mt-6 ">
          <IngredientsTable recipeId={recipeId} />
        </div>

        <div className="mt-6">
          <AddIngredientButton recipeId={recipeId} />
        </div>
      </section>
    </>
  );
}
