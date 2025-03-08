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
import {
  COMMENTS_PER_PAGE,
  REPLIES_PER_COMMENT,
  THREADS_PER_PAGE,
} from "@/lib/constants";
import { getThreadsInfiniteQueryOptions } from "@/api/thread.api";

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
    const existingCommentArray =
      await queryClient.ensureInfiniteQueryData(commentsQueryOptions);

    let action: () => Promise<unknown>;
    let newUserVote: number | null;
    let upvotesDelta = 0;
    let downvotesDelta = 0;

    if (userVote === value) {
      // Delete vote
      action = () => deleteCommentVote(commentId);
      newUserVote = null;

      if (value === 1) upvotesDelta = -1;
      else if (value === -1) downvotesDelta = -1;
    } else if (userVote && userVote !== value) {
      // Update vote
      action = () => updateCommentVote(commentId, value);
      newUserVote = value;

      if (value === 1) {
        upvotesDelta = 1;
        downvotesDelta = -1;
      } else {
        upvotesDelta = -1;
        downvotesDelta = 1;
      }
    } else {
      // Create vote
      action = () => createCommentVote(commentId, value);
      newUserVote = value;

      if (value === 1) upvotesDelta = 1;
      else if (value === -1) downvotesDelta = 1;
    }
    const newArray = existingCommentArray?.pages.map((page) =>
      page.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              userVote: newUserVote,
              upvotes: comment.upvotes + upvotesDelta,
              downvotes: comment.downvotes + downvotesDelta,
            }
          : comment
      )
    );
    queryClient.setQueryData(commentsQueryOptions.queryKey, () => ({
      pages: newArray,
      pageParams: existingCommentArray.pageParams,
    }));

    return await action();
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
    onSuccess: () => {
      queryClient.invalidateQueries(
        getThreadsInfiniteQueryOptions("all", THREADS_PER_PAGE)
      );
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
