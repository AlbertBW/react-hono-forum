import {
  deleteCommentVote,
  updateCommentVote,
  createCommentVote,
} from "@/api/comment-vote.api";
import { getCommentsInfiniteQueryOptions } from "@/api/comment.api";
import { useSession } from "@/lib/auth-client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { COMMENTS_PER_PAGE, REPLIES_PER_COMMENT } from "@/lib/constants";

export default function VoteComment({
  threadId,
  commentId,
  userVote,
  upvotes,
  downvotes,
  parentId,
}: {
  threadId: string;
  commentId: string;
  userVote: number | null;
  upvotes: number;
  downvotes: number;
  parentId: string | null;
}) {
  const { isPending: isSessionLoading, data: sessionData } = useSession();
  const queryClient = useQueryClient();
  const limit = parentId ? REPLIES_PER_COMMENT : COMMENTS_PER_PAGE;
  const commentsQueryOptions = getCommentsInfiniteQueryOptions(
    threadId,
    limit,
    parentId ? parentId : undefined
  );

  const handleVote = async (value: number) => {
    if (!sessionData) {
      toast.error("Error", { description: `You must be logged in to vote` });
      return;
    }
    console.log(parentId);
    const existingCommentArray =
      await queryClient.ensureInfiniteQueryData(commentsQueryOptions);

    if (userVote === value) {
      // Delete vote
      const newArray = existingCommentArray?.pages.map((page) =>
        page.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                userVote: null,
                upvotes: value === 1 ? comment.upvotes - 1 : comment.upvotes,
                downvotes:
                  value === -1 ? comment.downvotes - 1 : comment.downvotes,
              }
            : comment
        )
      );
      queryClient.setQueryData(commentsQueryOptions.queryKey, () => ({
        pages: newArray,
        pageParams: existingCommentArray.pageParams,
      }));

      return await deleteCommentVote(commentId);
    }

    if (userVote && userVote !== value) {
      // Update vote
      const newArray = existingCommentArray?.pages.map((page) =>
        page.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                userVote: value,
                upvotes:
                  value === 1 ? comment.upvotes + 1 : comment.upvotes - 1,
                downvotes:
                  value === -1 ? comment.downvotes + 1 : comment.downvotes - 1,
              }
            : comment
        )
      );
      queryClient.setQueryData(commentsQueryOptions.queryKey, () => ({
        pages: newArray,
        pageParams: existingCommentArray.pageParams,
      }));

      return await updateCommentVote(commentId, value);
    }

    // Create vote
    const newArray = existingCommentArray?.pages.map((page) =>
      page.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              userVote: value,
              upvotes: value === 1 ? comment.upvotes + 1 : comment.upvotes,
              downvotes:
                value === -1 ? comment.downvotes + 1 : comment.downvotes,
            }
          : comment
      )
    );
    queryClient.setQueryData(commentsQueryOptions.queryKey, () => ({
      pages: newArray,
      pageParams: existingCommentArray.pageParams,
    }));

    return await createCommentVote(commentId, value);
  };

  const mutation = useMutation({
    mutationFn: handleVote,
    onError: (error) => {
      toast.error("Error", {
        description: error instanceof Error ? error.message : `Failed to vote`,
      });
      // invalidate the query to refetch the data
      queryClient.invalidateQueries(commentsQueryOptions);
      // queryClient.invalidateQueries(getThread);
    },
  });
  return (
    <div className="flex gap-1.5 justify-center items-center text-accent-foreground/80">
      <Button
        className={`rounded-full size-8 hover:text-green-500 ${userVote === 1 ? "text-green-600" : ""}`}
        variant={"ghost"}
        size={"icon"}
        onClick={() => mutation.mutate(1)}
        disabled={mutation.isPending || isSessionLoading}
      >
        <ArrowBigUp className="size-6" />
      </Button>
      <span className="text-sm">{upvotes - downvotes}</span>
      <Button
        className={`rounded-full size-8 hover:text-red-500 ${userVote === -1 ? "text-red-600" : ""}`}
        variant={"ghost"}
        size={"icon"}
        onClick={() => mutation.mutate(-1)}
        disabled={mutation.isPending || isSessionLoading}
      >
        <ArrowBigDown className="size-6" />
      </Button>
    </div>
  );
}
