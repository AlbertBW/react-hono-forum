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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Link, useLocation } from "@tanstack/react-router";
import { Dialog, DialogTrigger } from "./ui/dialog";
import CreateCommunityDialog from "./create-community-dialog";
import { useQuery } from "@tanstack/react-query";
import { getAllCommunitiesQueryOptions } from "@/lib/api";
import { Skeleton } from "./ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

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
  const { isPending, error, data } = useQuery(getAllCommunitiesQueryOptions);

  const { open } = useSidebar();

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
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
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
                    {isPending ? (
                      Array(3)
                        .fill(0)
                        .map((_, i) => (
                          <SidebarMenuItem key={i}>
                            <SidebarMenuButton
                              asChild
                              className="text-base font-normal h-10"
                            >
                              <Skeleton />
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))
                    ) : error ? (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="text-base font-normal h-10"
                        >
                          <span>Error</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ) : (
                      data.map((community) => (
                        <SidebarMenuItem key={community.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={
                              location.pathname === `/c/${community.name}`
                            }
                            className="text-base font-normal h-10"
                          >
                            <Link
                              to={`/c/$name`}
                              params={{ name: community.name }}
                            >
                              {community.icon ? (
                                <Avatar
                                  className={`${open ? "size-8" : "size-4"} transition-all`}
                                >
                                  <AvatarImage
                                    src={community.icon}
                                    alt={`${community.name} icon`}
                                  />
                                </Avatar>
                              ) : (
                                <Avatar
                                  className={`bg-zinc-800 flex justify-center items-center transition-all ${
                                    open ? "size-8" : "size-4 text-transparent"
                                  }`}
                                >
                                  <AvatarFallback>
                                    {community.name
                                      ? community.name
                                          .substring(0, 3)
                                          .toUpperCase()
                                      : ""}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <span>{community.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))
                    )}
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
