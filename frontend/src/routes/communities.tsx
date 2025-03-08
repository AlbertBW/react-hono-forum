import {
  CommunityCardType,
  getAllCommunitiesInfiniteQueryOptions,
} from "@/api/community.api";
import {
  JoinButton,
  LeaveCommunity,
} from "@/components/buttons/join-leave-community";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/spinner";
import { AvatarImage } from "@radix-ui/react-avatar";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/communities")({
  component: CommunitiesPage,
});

function CommunitiesPage() {
  const [search, setSearch] = useState("new");
  const queryOptions = getAllCommunitiesInfiniteQueryOptions(12, search);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    status: threadStatus,
    refetch,
  } = useInfiniteQuery(queryOptions);

  useEffect(() => {
    refetch();
  }, [search, refetch]);

  const pages = data?.pages.flatMap((page) => page);

  return (
    <div className="p-4">
      <div className="flex justify-between">
        <h2 className="text-2xl md:text-3xl font-semibold pb-4">
          Find Communities
        </h2>
        <Select onValueChange={(value) => setSearch(value)} defaultValue="new">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Order by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="popular">Most popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />
      {threadStatus === "pending" || isFetching ? (
        <div className="flex w-full justify-center items-center pt-4">
          <LoadingSpinner />
        </div>
      ) : threadStatus === "error" ? (
        <div>Error</div>
      ) : (
        pages && (
          <>
            <div className="flex flex-wrap gap-4 pt-4">
              {pages.map((community) => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>

            {hasNextPage && (
              <div className="flex justify-center mt-4">
                <Button
                  disabled={!hasNextPage || isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  {isFetchingNextPage ? <LoadingSpinner /> : "Load more"}
                </Button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}

function CommunityCard({ community }: { community: CommunityCardType }) {
  return (
    <div className="rounded-lg shadow-md border hover:bg-zinc-900 cursor-pointer basis-full md:basis-[calc(50%-1rem)] xl:basis-[calc(33.333%-1rem)]">
      <Link to="/c/$name" params={{ name: community.name }}>
        <div className="px-3 p-2.5">
          <div className="">
            <div className="flex justify-between w-full mb-1">
              <div className="flex items-center gap-1.5">
                <Avatar>
                  {community.icon && (
                    <AvatarImage src={community.icon} alt={community.name} />
                  )}

                  <AvatarFallback>
                    <Skeleton />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col font-semibold">
                  <span>{community.name}</span>
                  <span className="text-xs text-accent-foreground/60 font-light">
                    {community.userCount} Members
                  </span>
                </div>
              </div>
              {!community.userFollow ? (
                <div
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  <JoinButton
                    className="rounded-full p-0 h-9 w-13 text-xs text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                    id={community.id}
                    name={community.name}
                  />
                </div>
              ) : (
                <div
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  <LeaveCommunity
                    className="rounded-full text-xs"
                    id={community.id}
                    name={community.name}
                  />
                </div>
              )}
            </div>
            <div className="">
              <div className="text-sm font-light text-accent-foreground/60 line-clamp-2 mr-2.5">
                {community.description}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
