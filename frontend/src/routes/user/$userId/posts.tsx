import { getThreadsInfiniteQueryOptions } from "@/api/thread.api";
import ThreadCard from "@/components/thread-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/spinner";
import { THREADS_PER_PAGE } from "@/lib/constants";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react";

export const Route = createFileRoute("/user/$userId/posts")({
  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = Route.useParams();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery(
      getThreadsInfiniteQueryOptions({ userId, limit: THREADS_PER_PAGE })
    );

  const pages = data?.pages.flatMap((page) => page);

  return (
    <div>
      {status === "pending" ? (
        <div className="flex justify-center items-center h-20">
          <LoadingSpinner />
        </div>
      ) : status === "error" ? (
        <div>Error fetching posts</div>
      ) : (
        <div>
          {pages?.map((thread) => (
            <Fragment key={thread.id}>
              <ThreadCard key={thread.id} thread={thread} viewContext="all" />
              <Separator />
            </Fragment>
          ))}
          {hasNextPage && (
            <div className="flex justify-center my-4">
              <Button
                disabled={!hasNextPage || isFetchingNextPage}
                onClick={() => fetchNextPage()}
                className="mb-4"
              >
                {isFetchingNextPage ? <LoadingSpinner /> : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
