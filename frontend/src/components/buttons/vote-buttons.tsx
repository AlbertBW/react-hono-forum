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
import { useState } from "react";

export default function VoteButtons({
  threadId,
  upvotes,
  downvotes,
  userVote,
}: {
  threadId: ThreadId;
  upvotes: number;
  downvotes: number;
  userVote: number | null;
}) {
  const { isPending: isSessionLoading, data: sessionData } = useSession();
  const [votes, setVotes] = useState(upvotes - downvotes);
  const [newUserVote, setUserVote] = useState(userVote);
  const queryClient = useQueryClient();

  const handleVote = async (value: number) => {
    if (!sessionData) {
      toast.error("Error", { description: `You must be logged in to vote` });
      return;
    }

    if (newUserVote === value) {
      // Cancel vote
      setUserVote(null);
      if (value === 1) setVotes((prev) => prev - 1);
      else if (value === -1) setVotes((prev) => prev + 1);
      return await deleteThreadVote(threadId);
    } else if (newUserVote !== null) {
      // Change vote
      setUserVote(value);
      if (value === 1) setVotes((prev) => prev + 2);
      else if (value === -1) setVotes((prev) => prev - 2);
      return await updateThreadVote(threadId, value);
    } else {
      // New vote
      setUserVote(value);
      setVotes((prev) => prev + value);
      return await createThreadVote(threadId, value);
    }
  };

  const mutation = useMutation({
    mutationFn: handleVote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["get-thread"] });
    },
    onError: (error) => {
      toast.error("Error", {
        description: error instanceof Error ? error.message : `Failed to vote`,
      });
      // invalidate the query to refetch the data
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["get-thread"] });
    },
  });

  return (
    <div
      className={`flex items-center gap-1 bg-secondary size-fit rounded-full hover:cursor-default transition-all ring-2 ${newUserVote === 1 ? "dark:bg-linear-to-br dark:from-green-900 bg-linear-to-br from-green-500/20 ring-green-600/40 dark:ring-green-700/60" : newUserVote === -1 ? "dark:bg-linear-to-tl dark:from-destructive bg-linear-to-tl from-red-500/20 ring-red-500/60 dark:ring-red-700/60" : "ring-transparent"}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Button
        variant={"ghost"}
        className={`rounded-full group transition hover:bg-transparent ${newUserVote === 1 ? "hover:fill-transparent" : newUserVote === -1 ? "hover:text-green-500" : ""}`}
        onClick={() => mutation.mutate(1)}
        disabled={mutation.isPending || isSessionLoading}
      >
        <ThumbsUp
          className={`size-3.5 sm:size-4 ${newUserVote === 1 ? "fill-primary group-hover:fill-transparent" : newUserVote === -1 ? "" : "group-hover:text-green-500"}`}
        />
      </Button>

      <span className="text-center text-xs sm:text-sm">{votes}</span>

      <Button
        variant={"ghost"}
        className={`rounded-full group transition hover:bg-transparent ${newUserVote === -1 ? "hover:fill-transparent" : newUserVote === 1 ? "hover:text-destructive-foreground" : ""}`}
        onClick={() => mutation.mutate(-1)}
        disabled={mutation.isPending || isSessionLoading}
      >
        <ThumbsDown
          className={`size-3.5 sm:size-4 ${newUserVote === -1 ? "fill-primary group-hover:fill-transparent" : newUserVote === 1 ? "" : "group-hover:text-destructive-foreground"}`}
        />
      </Button>
    </div>
  );
}
