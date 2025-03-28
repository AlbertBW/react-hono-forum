import { userQueryOptions } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isPending, error, data } = useQuery(userQueryOptions);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Not authorised</div>;
  }

  if (!data) {
    return <div>User not found</div>;
  }

  return <div>Hello {data.email}</div>;
}
