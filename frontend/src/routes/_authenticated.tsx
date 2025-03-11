import { createFileRoute, Outlet } from "@tanstack/react-router";
import { userQueryOptions } from "@/lib/api";
import SignInForm from "@/components/auth/sign-in-form";

const Login = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="mb-12">
        <SignInForm />
      </div>
    </div>
  );
};

const Component = () => {
  const user = Route.useRouteContext();
  if (!user) {
    return <Login />;
  }

  return <Outlet />;
};

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    const queryClient = context.queryClient;

    try {
      const data = await queryClient.fetchQuery(userQueryOptions);
      return data;
    } catch {
      return { user: null };
    }
  },
  component: Component,
});
