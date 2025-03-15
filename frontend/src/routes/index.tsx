import {
  getPopularThreadsQueryOptions,
  getThreadsInfiniteQueryOptions,
} from "@/api/thread.api";
import AllThreads from "@/components/all-threads";
import ThreadCard from "@/components/thread-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";
import { THREADS_PER_PAGE } from "@/lib/constants";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, ThumbsUp } from "lucide-react";
import { Fragment, useEffect } from "react";
import { useInView } from "react-intersection-observer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="p-2">
          <div className="bg-gradient-to-br from-card to-ring/15 hover:bg-muted border-2 border-primary/20 rounded-lg p-5 shadow-xl hover:shadow-2xl hover:border-primary/40 transition-all duration-300">
            <h1 className="text-xl font-bold text-card-foreground mb-3 relative">
              <span className="relative z-10 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-1/3 after:h-3 after:bg-primary/10 after:-z-10">
                Welcome to <span className="font-mono">RHForum</span>!
              </span>
            </h1>
            <p className="text-muted-foreground mb-5 leading-relaxed border-l-4 border-primary/20 pl-3">
              Sign in to join communities, create threads, and participate in
              discussions.
            </p>
            <Link
              to="/sign-in"
              className="inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 hover:-translate-y-1.5 transition-all duration-300 shadow-md hover:shadow-primary/20"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="px-2">
          <AllThreads />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="px-2">
        <HomeCarousel />

        <h2 className="text-xl font-bold text-card-foreground p-3">
          Following
        </h2>

        <Separator />
        <HomeFeed />
      </div>
    </div>
  );
}

function HomeCarousel() {
  const { data, isPending, error } = useQuery(
    getPopularThreadsQueryOptions(10)
  );

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 my-2 shadow-sm">
        <p className="text-destructive flex items-center gap-2">
          <span className="size-5 rounded-full bg-destructive/20 flex items-center justify-center">
            !
          </span>
          Error loading popular threads
        </p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="bg-gradient-to-br from-card to-ring/10 hover:bg-muted mt-1 border-2 border-primary/20 rounded-lg p-2 sm:p-5 shadow-xl hover:shadow-2xl hover:border-primary/40 transition-all duration-300">
        <h1 className="text-xl font-bold mb-3 p-1 sm:p-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Top Discussions
        </h1>

        {isPending && (
          <>
            <div className="sr-only" aria-live="polite">
              Loading popular discussions...
            </div>

            <div className="w-full relative" aria-hidden="true">
              <Carousel
                opts={{
                  align: "start",
                }}
              >
                <CarouselContent>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <CarouselItem
                      key={index}
                      className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                    >
                      <div className="block w-full h-full">
                        <div className="flex group flex-col gap-3 border border-border/70 rounded-xl px-5 py-4 bg-card shadow-sm h-full animate-pulse">
                          <div className="h-5 w-full bg-muted rounded-md"></div>
                          <div className="flex items-center gap-2.5 mt-1">
                            <Avatar className="size-6">
                              <AvatarFallback />
                            </Avatar>
                            <div className="h-4 w-24 bg-muted rounded-md"></div>
                          </div>
                          <div className="flex items-center gap-3 mt-auto pt-2 border-t border-border/30">
                            <div className="flex items-center gap-1">
                              <div className="size-3.5 rounded-full bg-muted"></div>
                              <div className="h-3 w-16 bg-muted rounded-md"></div>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="size-3.5 rounded-full bg-muted"></div>
                              <div className="h-3 w-20 bg-muted rounded-md"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </>
        )}

        {data && (
          <div className="relative px-1">
            <Carousel
              opts={{
                align: "start",
              }}
            >
              <CarouselContent>
                {data.map((thread) => (
                  <CarouselItem
                    key={thread.id}
                    className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                  >
                    <Link
                      to={"/c/$name/$id"}
                      params={{ name: thread.communityName, id: thread.id }}
                    >
                      <div className="flex group flex-col gap-3 border border-border/70 hover:border-border rounded-xl px-5 py-4 bg-card hover:bg-accent/20 shadow-sm hover:shadow-md transition-all duration-300">
                        <h2 className="font-semibold text-base line-clamp-1 text-foreground leading-tight">
                          {thread.title}
                        </h2>
                        <div className="flex items-center gap-2.5 mt-1">
                          <Avatar className="size-6 ring-1 ring-primary/20">
                            {thread.communityIcon && (
                              <AvatarImage
                                src={thread.communityIcon}
                                alt={`${thread.communityName} Icon`}
                              />
                            )}
                            <AvatarFallback className="bg-primary/10 text-xs">
                              {thread.communityName.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium text-foreground/80 group-hover:text-accent-foreground duration-300">
                            {thread.communityName}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground group-hover:text-accent-foreground mt-auto pt-2 border-t border-border/30 transition  duration-300">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="size-3.5" />
                            {thread.upvotes - thread.downvotes} votes
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="size-3.5" />
                            {thread.commentsCount} comments
                          </span>
                        </div>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <div className="absolute top-1/2 left-8 -translate-y-1/2 z-10">
                <CarouselPrevious className="bg-background/90 shadow-md hover:bg-background border border-border disabled:opacity-0 transition-all" />
              </div>
              <div className="absolute top-1/2 right-8 -translate-y-1/2 z-10">
                <CarouselNext className="bg-background/90 shadow-md hover:bg-background border border-border disabled:opacity-0 transition-all" />
              </div>
            </Carousel>
          </div>
        )}
      </div>
    </div>
  );
}

function HomeFeed() {
  const { ref, inView } = useInView();
  const { data: userData, isPending: userPending } = useSession();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: threadStatus,
  } = useInfiniteQuery(
    getThreadsInfiniteQueryOptions({
      communityName: "all",
      following: true,
      limit: THREADS_PER_PAGE,
    })
  );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

  const threads = data?.pages.flatMap((page) => page) || [];
  return (
    <main className="w-full max-w-7xl mx-auto">
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
          {threads.map((thread) => (
            <Fragment key={thread.id}>
              <ThreadCard thread={thread} viewContext="all" />
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
                  <span className="text-sm text-gray-400">Loading more...</span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Scroll for more</span>
              )}
            </div>
          ) : (
            <div className="h-10 flex items-center justify-center py-4 gap-2">
              <span className="text-sm text-gray-500">All threads loaded</span>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-4 mt-4 px-2 pb-2">
            <h3 className="text-lg font-semibold">
              You don't follow any communities yet!
            </h3>

            {!userPending && userData && (
              <Link
                to="/communities"
                className="inline-flex w-fit items-center px-4 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-500/90 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Find communities
              </Link>
            )}

            <Separator />
            <p className="text-sm text-foreground/50">
              or view all latest threads
            </p>
          </div>
          <AllThreads />
        </>
      )}
    </main>
  );
}
