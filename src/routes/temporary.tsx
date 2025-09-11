import { createFileRoute } from '@tanstack/react-router'
import TideMonitoringSiteCategories from '~/components/ui/TideMonitoringSiteCategories'

export const Route = createFileRoute('/temporary')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div><TideMonitoringSiteCategories/></div>
}
