import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/user/$userId/overview')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/user/$userId/overview"!</div>
}
