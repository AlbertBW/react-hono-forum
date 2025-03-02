import {
  deleteVote,
  updateVote,
  createVote,
  getPostQueryOptions,
  getPostsQueryOptions,
} from "@/lib/api";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { useSession } from "@/lib/auth-client";
import { PostId } from "../../../../server/db/schema";

export default function VoteButtons({
  postId,
  communityName,
  upvotes,
  downvotes,
  userVote,
}: {
  postId: PostId;
  communityName: string;
  upvotes: number;
  downvotes: number;
  userVote: number | null;
}) {
  const { isPending: isSessionLoading, data: sessionData } = useSession();
  const queryClient = useQueryClient();
  const postsQueryOptions = getPostsQueryOptions(communityName);
  const getPost = getPostQueryOptions(postId);

  console.log("userVote", userVote, postId, upvotes, downvotes, communityName);

  const handleVote = async (value: number) => {
    if (!sessionData) {
      toast.error("Error", { description: `You must be logged in to vote` });
      return;
    }

    const existingPostArray =
      await queryClient.ensureQueryData(postsQueryOptions);

    const existingPost = await queryClient.ensureQueryData(getPost);

    if (userVote === value) {
      // Delete vote
      queryClient.setQueryData(
        postsQueryOptions.queryKey,
        existingPostArray.map((p) =>
          p.id === postId
            ? {
                ...p,
                userVote: null,
                upvotes: value === 1 ? p.upvotes - 1 : p.upvotes,
                downvotes: value === -1 ? p.downvotes - 1 : p.downvotes,
              }
            : p
        )
      );

      queryClient.setQueryData(getPost.queryKey, {
        ...existingPost,
        userVote: null,
        upvotes: value === 1 ? upvotes - 1 : upvotes,
        downvotes: value === -1 ? downvotes - 1 : downvotes,
      });

      return await deleteVote(postId);
    }

    if (userVote && userVote !== value) {
      // Update vote
      queryClient.setQueryData(
        postsQueryOptions.queryKey,
        existingPostArray.map((p) =>
          p.id === postId
            ? {
                ...p,
                userVote: value,
                upvotes: value === 1 ? p.upvotes + 1 : p.upvotes - 1,
                downvotes: value === -1 ? p.downvotes + 1 : p.downvotes - 1,
              }
            : p
        )
      );

      queryClient.setQueryData(getPost.queryKey, {
        ...existingPost,
        userVote: value,
        upvotes: value === 1 ? upvotes + 1 : upvotes - 1,
        downvotes: value === -1 ? downvotes + 1 : downvotes - 1,
      });

      return await updateVote(postId, value);
    }

    // Create vote
    queryClient.setQueryData(
      postsQueryOptions.queryKey,
      existingPostArray.map((p) =>
        p.id === postId
          ? {
              ...p,
              userVote: value,
              upvotes: value === 1 ? p.upvotes + 1 : p.upvotes,
              downvotes: value === -1 ? p.downvotes + 1 : p.downvotes,
            }
          : p
      )
    );

    queryClient.setQueryData(getPost.queryKey, {
      ...existingPost,
      userVote: value,
      upvotes: value === 1 ? upvotes + 1 : upvotes,
      downvotes: value === -1 ? downvotes + 1 : downvotes,
    });

    return await createVote(postId, value);
  };

  const mutation = useMutation({
    mutationFn: handleVote,
    onError: () => {
      toast.error("Error", { description: `Failed to vote` });
      // invalidate the query to refetch the data
      queryClient.invalidateQueries(postsQueryOptions);
      queryClient.invalidateQueries(getPost);
    },
    onSuccess: () => {},
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
