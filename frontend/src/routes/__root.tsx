import Header from "@/components/header";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: Root,
});

function Root() {
  return (
    <>
      <Header />
      <hr />
      <main className="h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
      <Toaster />
    </>
  );
}
