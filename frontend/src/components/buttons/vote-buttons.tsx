import { useQueryClient, useMutation } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useSession } from "@/lib/auth-client";
import { ThreadId } from "../../../../server/db/schema";
import {
  deleteThreadVote,
  updateThreadVote,
  createThreadVote,
} from "@/api/thread-vote.api";
import {
  getThreadQueryOptions,
  getThreadsQueryOptions,
} from "@/api/thread.api";

export default function VoteButtons({
  threadId,
  communityName,
  upvotes,
  downvotes,
  userVote,
}: {
  threadId: ThreadId;
  communityName: string;
  upvotes: number;
  downvotes: number;
  userVote: number | null;
}) {
  const { isPending: isSessionLoading, data: sessionData } = useSession();
  const queryClient = useQueryClient();
  const threadsQueryOptions = getThreadsQueryOptions(communityName);
  const getThread = getThreadQueryOptions(threadId);

  const handleVote = async (value: number) => {
    if (!sessionData) {
      toast.error("Error", { description: `You must be logged in to vote` });
      return;
    }

    const existingThreadArray =
      await queryClient.ensureQueryData(threadsQueryOptions);

    const existingThread = await queryClient.ensureQueryData(getThread);

    if (userVote === value) {
      // Delete vote
      queryClient.setQueryData(
        threadsQueryOptions.queryKey,
        existingThreadArray.map((t) =>
          t.id === threadId
            ? {
                ...t,
                userVote: null,
                upvotes: value === 1 ? t.upvotes - 1 : t.upvotes,
                downvotes: value === -1 ? t.downvotes - 1 : t.downvotes,
              }
            : t
        )
      );

      queryClient.setQueryData(getThread.queryKey, {
        ...existingThread,
        userVote: null,
        upvotes: value === 1 ? upvotes - 1 : upvotes,
        downvotes: value === -1 ? downvotes - 1 : downvotes,
      });

      return await deleteThreadVote(threadId);
    }

    if (userVote && userVote !== value) {
      // Update vote
      queryClient.setQueryData(
        threadsQueryOptions.queryKey,
        existingThreadArray.map((t) =>
          t.id === threadId
            ? {
                ...t,
                userVote: value,
                upvotes: value === 1 ? t.upvotes + 1 : t.upvotes - 1,
                downvotes: value === -1 ? t.downvotes + 1 : t.downvotes - 1,
              }
            : t
        )
      );

      queryClient.setQueryData(getThread.queryKey, {
        ...existingThread,
        userVote: value,
        upvotes: value === 1 ? upvotes + 1 : upvotes - 1,
        downvotes: value === -1 ? downvotes + 1 : downvotes - 1,
      });

      return await updateThreadVote(threadId, value);
    }

    // Create vote
    queryClient.setQueryData(
      threadsQueryOptions.queryKey,
      existingThreadArray.map((t) =>
        t.id === threadId
          ? {
              ...t,
              userVote: value,
              upvotes: value === 1 ? t.upvotes + 1 : t.upvotes,
              downvotes: value === -1 ? t.downvotes + 1 : t.downvotes,
            }
          : t
      )
    );

    queryClient.setQueryData(getThread.queryKey, {
      ...existingThread,
      userVote: value,
      upvotes: value === 1 ? upvotes + 1 : upvotes,
      downvotes: value === -1 ? downvotes + 1 : downvotes,
    });

    return await createThreadVote(threadId, value);
  };

  const mutation = useMutation({
    mutationFn: handleVote,
    onError: (error) => {
      toast.error("Error", {
        description: error instanceof Error ? error.message : `Failed to vote`,
      });
      // invalidate the query to refetch the data
      queryClient.invalidateQueries(threadsQueryOptions);
      queryClient.invalidateQueries(getThread);
    },
  });

  return (
    <div
      className="flex items-center gap-1 bg-zinc-900 size-fit rounded-full hover:cursor-default"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Button
        variant={"ghost"}
        className={`rounded-full hover:text-green-500 ${userVote === 1 ? "text-green-500" : ""}`}
        onClick={() => mutation.mutate(1)}
        disabled={mutation.isPending || isSessionLoading}
      >
        <ThumbsUp />
      </Button>

      <span className="text-center text-sm">{upvotes - downvotes}</span>

      <Button
        variant={"ghost"}
        className={`rounded-full hover:text-red-500 ${userVote === -1 ? "text-red-500" : ""}`}
        onClick={() => mutation.mutate(-1)}
        disabled={mutation.isPending || isSessionLoading}
      >
        <ThumbsDown />
      </Button>
    </div>
  );
}
