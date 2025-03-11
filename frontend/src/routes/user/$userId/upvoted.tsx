import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/user/$userId/upvoted')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/user/$userId/upvotes"!</div>
}
