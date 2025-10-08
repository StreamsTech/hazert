import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { routeTree } from './routeTree.gen'
import { DefaultCatchBoundary } from './components/DefaultCatchBoundary'
import { NotFound } from './components/NotFound'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'

// Enable MSW in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  import('./mocks/browser.js').then(async ({ worker }) => {
    try {
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
        // Better lifecycle management
        quiet: false,
        waitUntilReady: true,
      })

      // Ensure MSW is ready before app starts making requests
      await worker.listHandlers()
      console.log('🚀 MSW enabled for development with', worker.listHandlers().length, 'handlers')

      // Handle service worker updates/reloads
      worker.events.on('unhandledException', ({ error, request }) => {
        console.error('MSW unhandled exception:', error, 'Request:', request.url)
      })

    } catch (error) {
      console.error('Failed to start MSW:', error)
    }
  }).catch(error => {
    console.error('Failed to import MSW:', error)
  })
}

export function createRouter() {
  const rqContext = TanstackQuery.getContext()
  const router = createTanStackRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: 'intent',
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    Wrap: (props: { children: React.ReactNode }) => (
      <TanstackQuery.Provider {...rqContext}>{props.children}</TanstackQuery.Provider>
    ),
  })
  setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
