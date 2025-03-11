import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/user/$userId/comments')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/user/$userId/comments"!</div>
}
