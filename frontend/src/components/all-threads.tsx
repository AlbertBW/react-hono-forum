import { getThreadsInfiniteQueryOptions } from "@/api/thread.api";
import { useSession } from "@/lib/auth-client";
import { THREADS_PER_PAGE } from "@/lib/constants";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Fragment } from "react/jsx-runtime";
import ThreadCard from "./thread-card";
import { Separator } from "./ui/separator";

export default function AllThreads() {
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
