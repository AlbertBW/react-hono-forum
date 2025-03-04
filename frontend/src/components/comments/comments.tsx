import { getCommentsInfiniteQueryOptions } from "@/api/comment.api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";
import CommentCard from "./comment-card";
import { LoadingSpinner } from "../ui/spinner";
import { COMMENTS_PER_PAGE, REPLIES_PER_COMMENT } from "@/lib/constants";

export default function Comments({
  threadId,
  parentId,
}: {
  threadId: string;
  parentId?: string;
}) {
  const limit = parentId ? REPLIES_PER_COMMENT : COMMENTS_PER_PAGE;
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: threadStatus,
  } = useInfiniteQuery(
    getCommentsInfiniteQueryOptions(threadId, limit, parentId)
  );

  const comments = data?.pages.flatMap((page) => page) || [];

  return (
    <>
      {threadStatus === "pending" ? (
        <div className="flex items-center mx-4 w-full">
          <LoadingSpinner />
        </div>
      ) : threadStatus === "error" ? (
        <div className="flex flex-col justify-center items-center w-full gap-4 mt-4">
          <h3 className="text-lg font-bold">Failed to Load threads</h3>
          <p className="text-sm text-muted-foreground">
            An error occurred while trying to load threads.
          </p>
        </div>
      ) : comments.length > 0 ? (
        comments.map((comment) => (
          <CommentCard key={comment.id} comment={comment} threadId={threadId} />
        ))
      ) : (
        <div className="flex flex-col justify-center items-center w-full gap-4 mt-4">
          <h3 className="text-lg font-bold">No comments</h3>
          <p className="text-sm text-muted-foreground">
            Be the first to comment on this thread
          </p>
        </div>
      )}

      {comments.length > 0 &&
        (hasNextPage ? (
          <div className="py-4 flex justify-center sm:justify-start">
            <Button
              className="rounded-full"
              variant={"secondary"}
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              <ChevronDown />
              <span className="text-xs pr-1">
                {isFetchingNextPage ? "Loading..." : "View more comments"}
              </span>
            </Button>
          </div>
        ) : (
          !parentId &&
          !hasNextPage &&
          comments.length > 0 && (
            <div className="py-4">
              <p className="text-center sm:text-start text-muted-foreground/60 text-sm">
                All comments loaded
              </p>
            </div>
          )
        ))}
    </>
  );
}
