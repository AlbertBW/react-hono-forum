import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
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
    <SidebarProvider className="flex flex-col">
      <Header />
      <div className="flex flex-row h-[calc(100vh-4.6rem)]">
        <AppSidebar />

        <div className="h-[calc(100vh-4.6rem)] w-full">
          <Outlet />
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
