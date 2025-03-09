import ThreadCard from "@/components/thread-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Fragment } from "react/jsx-runtime";
import Aside from "@/components/layout/aside";
import {
  JoinButton,
  LeaveCommunity,
} from "@/components/buttons/join-leave-community";
import { getCommunityQueryOptions } from "@/api/community.api";
import { getThreadsInfiniteQueryOptions } from "@/api/thread.api";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { THREADS_PER_PAGE } from "@/lib/constants";

export const Route = createFileRoute("/c/$name/")({
  component: CommunityPage,
});

function CommunityPage() {
  const navigate = useNavigate();
  const { ref, inView } = useInView();
  const { name } = Route.useParams();
  const { data: userData, isPending: userPending } = useSession();
  const {
    isPending,
    error,
    data: community,
  } = useQuery(getCommunityQueryOptions(name));

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: threadStatus,
  } = useInfiniteQuery(getThreadsInfiniteQueryOptions(name, THREADS_PER_PAGE));

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

  const threads = data?.pages.flatMap((page) => page) || [];

  if (error || (!isPending && !community)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <h1 className="text-4xl font-bold mb-4">Community Not Found</h1>
        <p className="text-lg text-muted-foreground mb-8">
          The community "{name}" doesn't exist or has been removed.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sm:p-4 mx-auto">
        <div
          className={`w-full h-18 md:h-32 sm:rounded-md transition-all ${isPending ? "bg-zinc-900 opacity-0" : "bg-cover bg-center opacity-100"} `}
          style={
            !isPending
              ? {
                  backgroundImage: `url(${community.banner})`,
                }
              : undefined
          }
        ></div>
        <div className="max-w-7xl mx-auto">
          <section className="-translate-y-1/5 sm:-translate-y-2/5 px-4 min-h-20 flex flex-col sm:flex-row justify-between w-full sm:items-end gap-2 sm:gap-4">
            <div className="flex items-end gap-2">
              <div className="border-3 size-fit rounded-full border-black">
                {isPending ? (
                  <Avatar className={`size-14 md:size-20 lg:size-26 bg-black`}>
                    <AvatarFallback>
                      <Skeleton className="h-full w-full rounded-full" />
                    </AvatarFallback>
                  </Avatar>
                ) : community && community.icon ? (
                  <Avatar
                    className={`size-14 md:size-20 lg:size-26 flex justify-center items-center`}
                  >
                    <AvatarImage
                      src={community.icon}
                      alt={`${community.name} icon`}
                      className="object-fill"
                    />
                  </Avatar>
                ) : (
                  <Avatar
                    className={`flex justify-center items-center size-14 md:size-20 lg:size-26 text-xl `}
                  >
                    <AvatarFallback>
                      <Skeleton />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl lg:text-4xl font-bold">
                  {isPending ? (
                    <Skeleton className="h-8 w-32 md:h-6 md:w-40 lg:h-8 lg:w-48" />
                  ) : (
                    community?.name
                  )}
                </h2>
              </div>
            </div>
            {!userPending && userData && community && (
              <div className="flex justify-end sm:items-end gap-4">
                <Button
                  onClick={() =>
                    navigate({ to: `/c/${community.name}/create-thread` })
                  }
                  variant={"outline"}
                >
                  <Plus />
                  Create Thread
                </Button>

                {isPending ? (
                  <Skeleton className="h-8 w-18" />
                ) : (
                  community &&
                  (community.isFollowing ? (
                    <LeaveCommunity id={community.id} name={community.name} />
                  ) : (
                    <JoinButton
                      id={community.id}
                      name={community.name}
                      className="bg-blue-600 hover:bg-blue-500 text-accent-foreground w-18"
                    />
                  ))
                )}
              </div>
            )}
          </section>

          <div className="flex relative">
            <main className="w-full">
              {threadStatus === "pending" ? (
                <div className="flex flex-col justify-center items-center w-full gap-4 mt-4"></div>
              ) : threadStatus === "error" ? (
                <div className="flex flex-col justify-center items-center w-full gap-4 mt-4">
                  <h3 className="text-lg font-bold">Failed to Load threads</h3>
                  <p className="text-sm text-muted-foreground">
                    An error occurred while trying to load threads.
                  </p>
                </div>
              ) : threads && threads.length > 0 ? (
                <>
                  <Separator />
                  {threads.map((thread) => (
                    <Fragment key={thread.id}>
                      <ThreadCard
                        thread={thread}
                        isMod={
                          community?.moderators.some(
                            (mod) => mod.userId === thread.userId
                          ) || false
                        }
                      />
                      <Separator />
                    </Fragment>
                  ))}

                  {/* Invisible element to trigger loading more */}
                  {hasNextPage ? (
                    <div
                      ref={ref}
                      className="h-10 flex items-center justify-center py-4"
                    >
                      {isFetchingNextPage ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                          <span className="text-sm text-gray-400">
                            Loading more...
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Scroll for more
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="h-10 flex items-center justify-center py-4 gap-2">
                      <span className="text-sm text-gray-500">
                        All threads loaded
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-4 mt-4">
                  <h3 className="text-lg font-bold">No Threads Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    {!userPending
                      ? userData
                        ? "Be the first to post in this community!"
                        : "Sign in to post in this community!"
                      : null}
                  </p>
                </div>
              )}
            </main>
            {isPending ? null : community ? (
              <Aside community={community} />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
