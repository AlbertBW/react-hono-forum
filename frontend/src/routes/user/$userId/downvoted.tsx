import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/user/$userId/downvoted")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/user/$userId/downvotes"!</div>;
}
