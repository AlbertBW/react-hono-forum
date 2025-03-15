import {
  getCommentsInfiniteQueryOptions,
  loadingCreateCommentQueryOptions,
} from "@/api/comment.api";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";
import CommentCard, { CommentSkeleton } from "./comment-card";
import { LoadingSpinner } from "../ui/spinner";
import { COMMENTS_PER_PAGE, REPLIES_PER_COMMENT } from "@/lib/constants";

export default function Comments({
  threadId,
  parentId,
  communityName,
}: {
  threadId: string;
  parentId?: string;
  communityName: string;
}) {
  const limit = parentId ? REPLIES_PER_COMMENT : COMMENTS_PER_PAGE;
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: commentsStatus,
  } = useInfiniteQuery(
    getCommentsInfiniteQueryOptions(threadId, limit, parentId)
  );
  const { data: loadingNewComment } = useQuery(
    loadingCreateCommentQueryOptions
  );

  const comments = data?.pages.flatMap((page) => page) || [];

  return (
    <>
      {!parentId &&
        loadingNewComment?.comment &&
        loadingNewComment.comment.parentId === undefined && (
          <CommentSkeleton comment={loadingNewComment.comment} />
        )}

      {commentsStatus === "pending" ? (
        <div className="flex items-center justify-center h-24 mx-4 w-full">
          <LoadingSpinner />
        </div>
      ) : commentsStatus === "error" ? (
        <div className="flex flex-col justify-center items-center w-full gap-4 mt-4">
          <h3 className="text-lg font-bold">Failed to Load comments</h3>
          <p className="text-sm text-muted-foreground">
            An error occurred while trying to load comments.
          </p>
        </div>
      ) : comments.length > 0 ? (
        comments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            threadId={threadId}
            communityName={communityName}
          />
        ))
      ) : (
        !loadingNewComment?.comment && (
          <div className="flex flex-col justify-center items-center w-full gap-4 mt-4">
            <h3 className="text-lg font-bold">No comments</h3>
            <p className="text-sm text-muted-foreground">
              Be the first to comment on this thread
            </p>
          </div>
        )
      )}

      {comments.length > 0 && hasNextPage && (
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
      )}
    </>
  );
}
