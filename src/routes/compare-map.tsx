import { createFileRoute } from '@tanstack/react-router'
import { ClientOnly } from '@tanstack/react-router'
import { CompareMap } from '~/components/ui/CompareMap'

export const Route = createFileRoute('/compare-map')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="h-screen w-full">
      <ClientOnly fallback={
        <div className="h-screen w-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-700">Loading map comparison...</div>
            <div className="text-sm text-gray-500 mt-2">Preparing side-by-side view</div>
          </div>
        </div>
      }>
        <CompareMap />
      </ClientOnly>
    </div>
  )
}
