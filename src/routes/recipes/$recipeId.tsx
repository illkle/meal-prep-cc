import { createFileRoute } from '@tanstack/react-router'

import { SiteHeader } from '@/components/site-header'
import { useRecipe } from '@/lib/db'

export const Route = createFileRoute('/recipes/$recipeId')({
  component: RecipePage,
})

function RecipePage() {
  const { recipeId } = Route.useParams()
  const recipeQuery = useRecipe(recipeId)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-12">
        <p className="text-sm uppercase tracking-[0.6em] text-muted-foreground">
          Recipe ID
        </p>
        <h1 className="mt-4 text-5xl font-semibold uppercase tracking-[0.35em]">
          {recipeId}
        </h1>

        {recipeQuery.data ? (
          <p className="mt-6 text-lg text-muted-foreground">
            {recipeQuery.data.name}
          </p>
        ) : (
          <p className="mt-6 text-lg text-muted-foreground">
            This recipe has not been fully set up yet. Details coming soon.
          </p>
        )}
      </main>
    </div>
  )
}
