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
  getSingleThreadQueryOptions,
  getThreadsInfiniteQueryOptions,
} from "@/api/thread.api";
import { THREADS_PER_PAGE } from "@/lib/constants";

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
  const threadsQueryOptions = getThreadsInfiniteQueryOptions({
    communityName,
    limit: THREADS_PER_PAGE,
  });
  const singleThreadQueryOptions = getSingleThreadQueryOptions(threadId);

  const handleVote = async (value: number) => {
    if (!sessionData) {
      toast.error("Error", { description: `You must be logged in to vote` });
      return;
    }

    let action: () => Promise<unknown>;
    let newUserVote: number | null;
    let upvotesDelta = 0;
    let downvotesDelta = 0;

    if (userVote === value) {
      // Cancel vote
      action = () => deleteThreadVote(threadId);
      newUserVote = null;

      // Update counts
      if (value === 1) upvotesDelta = -1;
      else if (value === -1) downvotesDelta = -1;
    } else if (userVote !== null) {
      // Change vote
      action = () => updateThreadVote(threadId, value);
      newUserVote = value;

      // Update both counts
      if (value === 1) {
        upvotesDelta = 1;
        downvotesDelta = -1;
      } else {
        upvotesDelta = -1;
        downvotesDelta = 1;
      }
    } else {
      // New vote
      action = () => createThreadVote(threadId, value);
      newUserVote = value;

      // Update one count
      if (value === 1) upvotesDelta = 1;
      else if (value === -1) downvotesDelta = 1;
    }

    const existingThreadArray =
      await queryClient.ensureInfiniteQueryData(threadsQueryOptions);
    const newArray = existingThreadArray?.pages.map((page) =>
      page.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              userVote: newUserVote,
              upvotes: thread.upvotes + upvotesDelta,
              downvotes: thread.downvotes + downvotesDelta,
            }
          : thread
      )
    );

    queryClient.setQueryData(threadsQueryOptions.queryKey, {
      pages: newArray,
      pageParams: existingThreadArray.pageParams,
    });

    const existingThread = await queryClient.ensureQueryData(
      singleThreadQueryOptions
    );
    queryClient.setQueryData(singleThreadQueryOptions.queryKey, {
      ...existingThread,
      userVote: newUserVote,
      upvotes: upvotes + upvotesDelta,
      downvotes: downvotes + downvotesDelta,
    });

    const allThreadsQueryOptions = getThreadsInfiniteQueryOptions({
      communityName: "all",
      limit: THREADS_PER_PAGE,
    });
    const allThreads = await queryClient.ensureInfiniteQueryData(
      allThreadsQueryOptions
    );
    const allNewArray = allThreads?.pages.map((page) =>
      page.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              userVote: newUserVote,
              upvotes: thread.upvotes + upvotesDelta,
              downvotes: thread.downvotes + downvotesDelta,
            }
          : thread
      )
    );

    queryClient.setQueryData(allThreadsQueryOptions.queryKey, {
      pages: allNewArray,
      pageParams: allThreads.pageParams,
    });

    // Execute the action
    return await action();
  };

  const mutation = useMutation({
    mutationFn: handleVote,
    onError: (error) => {
      toast.error("Error", {
        description: error instanceof Error ? error.message : `Failed to vote`,
      });
      // invalidate the query to refetch the data
      queryClient.invalidateQueries(threadsQueryOptions);
      queryClient.invalidateQueries(singleThreadQueryOptions);
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
        className={`rounded-full hover:text-green-500 ${userVote === 1 ? "text-green-500" : ""} `}
        onClick={() => mutation.mutate(1)}
        disabled={mutation.isPending || isSessionLoading}
      >
        <ThumbsUp className="size-3 sm:size-4" />
      </Button>

      <span className="text-center text-xs sm:text-sm">
        {upvotes - downvotes}
      </span>

      <Button
        variant={"ghost"}
        className={`rounded-full hover:text-red-500 ${userVote === -1 ? "text-red-500" : ""}`}
        onClick={() => mutation.mutate(-1)}
        disabled={mutation.isPending || isSessionLoading}
      >
        <ThumbsDown className="size-3 sm:size-4" />
      </Button>
    </div>
  );
}
