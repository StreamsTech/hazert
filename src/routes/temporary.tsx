import { createFileRoute } from '@tanstack/react-router'
// import TideMonitoringSiteCategories from '~/components/ui/TideMonitoringSiteCategories'

export const Route = createFileRoute('/temporary')({
  component: RouteComponent,
})

function RouteComponent() {
  // @ts-ignore
  return <div className=' bg-white'><WaterLevelChart
      title="Custom Title"
  /></div>
}
