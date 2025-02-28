import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/c/all')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/c/all"!</div>
}
