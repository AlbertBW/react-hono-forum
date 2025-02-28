import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/c/$name/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { name, id } = Route.useParams();
  return (
    <div>
      Hello "/c/{name}/{id}"!
    </div>
  );
}
