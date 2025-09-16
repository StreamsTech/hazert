import { createFileRoute } from '@tanstack/react-router'
import BrushChart from '~/components/ui/BrushChart'
// import TideMonitoringSiteCategories from '~/components/ui/TideMonitoringSiteCategories'

export const Route = createFileRoute('/temporary')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div className='w-1/3 h-2/3 bg-white'><BrushChart/></div>
}
