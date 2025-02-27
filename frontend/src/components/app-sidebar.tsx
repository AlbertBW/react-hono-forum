import { List, Home, Orbit, Plus, Rocket, ChevronRight } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { useLocation } from "@tanstack/react-router";
import { Dialog, DialogTrigger } from "./ui/dialog";
import CreateCommunityDialog from "./create-community-dialog";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Popular",
    url: "/c/popular",
    icon: Rocket,
  },
  {
    title: "Explore",
    url: "/explore",
    icon: Orbit,
  },
  {
    title: "All",
    url: "/c/all",
    icon: List,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Dialog>
      <Sidebar
        className="h-[calc(100vh-3.6rem)] mt-[3.6rem]"
        collapsible="icon"
      >
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="text-lg font-normal text-muted-foreground h-10"
                      isActive={location.pathname === item.url}
                    >
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <Collapsible
            title={"Communities"}
            defaultOpen
            className="group/collapsible text-muted-foreground"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="group/label text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <CollapsibleTrigger>
                  Communities
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={false}
                        className="text-base font-normal h-10"
                      >
                        <DialogTrigger>
                          <Plus />
                          <span>Create a Community</span>
                        </DialogTrigger>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        </SidebarContent>
      </Sidebar>

      {/* Create Community Dialog */}
      <CreateCommunityDialog />
    </Dialog>
  );
}
