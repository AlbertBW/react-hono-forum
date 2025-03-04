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
  const threadsQueryOptions = getThreadsInfiniteQueryOptions(
    communityName,
    THREADS_PER_PAGE
  );
  const singleThreadQueryOptions = getSingleThreadQueryOptions(threadId);

  const handleVote = async (value: number) => {
    if (!sessionData) {
      toast.error("Error", { description: `You must be logged in to vote` });
      return;
    }

    const existingThreadArray =
      await queryClient.ensureInfiniteQueryData(threadsQueryOptions);
    const existingThread = await queryClient.ensureQueryData(
      singleThreadQueryOptions
    );

    if (userVote === value) {
      // Delete vote
      const newArray = existingThreadArray?.pages.map((page) =>
        page.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                userVote: null,
                upvotes: value === 1 ? thread.upvotes - 1 : thread.upvotes,
                downvotes:
                  value === -1 ? thread.downvotes - 1 : thread.downvotes,
              }
            : thread
        )
      );

      queryClient.setQueryData(threadsQueryOptions.queryKey, () => ({
        pages: newArray,
        pageParams: existingThreadArray.pageParams,
      }));

      queryClient.setQueryData(singleThreadQueryOptions.queryKey, {
        ...existingThread,
        userVote: null,
        upvotes: value === 1 ? upvotes - 1 : upvotes,
        downvotes: value === -1 ? downvotes - 1 : downvotes,
      });

      return await deleteThreadVote(threadId);
    }

    if (userVote && userVote !== value) {
      // Update vote
      const newArray = existingThreadArray?.pages.map((page) =>
        page.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                userVote: value,
                upvotes: value === 1 ? thread.upvotes + 1 : thread.upvotes - 1,
                downvotes:
                  value === -1 ? thread.downvotes + 1 : thread.downvotes - 1,
              }
            : thread
        )
      );

      queryClient.setQueryData(threadsQueryOptions.queryKey, () => ({
        pages: newArray,
        pageParams: existingThreadArray.pageParams,
      }));

      queryClient.setQueryData(singleThreadQueryOptions.queryKey, {
        ...existingThread,
        userVote: value,
        upvotes: value === 1 ? upvotes + 1 : upvotes - 1,
        downvotes: value === -1 ? downvotes + 1 : downvotes - 1,
      });

      return await updateThreadVote(threadId, value);
    }

    // Create vote
    const newArray = existingThreadArray?.pages.map((page) =>
      page.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              userVote: value,
              upvotes: value === 1 ? thread.upvotes + 1 : thread.upvotes,
              downvotes: value === -1 ? thread.downvotes + 1 : thread.downvotes,
            }
          : thread
      )
    );
    queryClient.setQueryData(threadsQueryOptions.queryKey, () => ({
      pages: newArray,
      pageParams: existingThreadArray.pageParams,
    }));

    queryClient.setQueryData(singleThreadQueryOptions.queryKey, {
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
