import { getThreadsInfiniteQueryOptions } from "@/api/thread.api";
import AllThreads from "@/components/all-threads";
import ThreadCard from "@/components/thread-card";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";
import { THREADS_PER_PAGE } from "@/lib/constants";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
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
      <div>
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

        <AllThreads />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="px-2">
        <HomeFeed />
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
  );
}
