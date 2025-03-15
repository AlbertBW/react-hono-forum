import {
  List,
  Home,
  Orbit,
  Plus,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
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
import { useInfiniteQuery } from "@tanstack/react-query";
import { Skeleton } from "./ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useRef } from "react";
import { getAllCommunitiesInfiniteQueryOptions } from "@/api/community.api";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Communites",
    url: "/communities",
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
  const queryOptions = getAllCommunitiesInfiniteQueryOptions(10, "following");
  const { data, fetchNextPage, hasNextPage, status } =
    useInfiniteQuery(queryOptions);

  const pages = data?.pages.flatMap((page) => page);

  const dialogTriggerRef = useRef<HTMLButtonElement>(null);

  const { open } = useSidebar();

  return (
    <Dialog>
      <Sidebar className="h-[calc(100vh-3.22rem)] mt-[52px]" collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="text-lg font-normal h-10"
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
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild className="group/label text-sm">
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
                        onClick={() => dialogTriggerRef.current?.click()}
                      >
                        <button type="button">
                          <Plus />
                          <span>Create a Community</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {status === "pending" ? (
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
                    ) : status === "error" ? (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="text-base font-normal h-10"
                        >
                          <span>Error</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ) : !pages ? (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="text-base font-normal h-10"
                        >
                          <span>No communities</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ) : pages.length === 0 ? (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="text-base font-normal h-10"
                        >
                          <Link to={`/communities`}>
                            <span>Find communities</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ) : (
                      pages.map((community) => (
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
                                  className={`bg-secondary flex justify-center items-center transition-all ${
                                    open ? "size-8" : "size-4 text-transparent"
                                  }`}
                                >
                                  <AvatarFallback></AvatarFallback>
                                </Avatar>
                              )}
                              <span>{community.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))
                    )}
                    {hasNextPage && (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={false}
                          className="text-base font-normal h-10"
                          onClick={() => fetchNextPage()}
                        >
                          <button type="button" className="">
                            <ChevronDown />
                            <span>Show more</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        </SidebarContent>
      </Sidebar>

      <DialogTrigger asChild>
        <button ref={dialogTriggerRef} className="hidden" aria-hidden="true">
          Open Dialog
        </button>
      </DialogTrigger>

      {/* Create Community Dialog */}
      <CreateCommunityDialog />
    </Dialog>
  );
}
