import {
  PostCard,
  getCommunityQueryOptions,
  deleteVote,
  updateVote,
  createVote,
  getPostQueryOptions,
} from "@/lib/api";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";

export default function VoteButtons({ post }: { post: PostCard }) {
  const queryClient = useQueryClient();
  const communityQueryOption = getCommunityQueryOptions(post.communityName!);

  const handleVote = async (value: number) => {
    const existingCommunity =
      await queryClient.ensureQueryData(communityQueryOption);

    const getPost = getPostQueryOptions(post.id);
    const existingPost = await queryClient.ensureQueryData(getPost);

    if (post.userVote === value) {
      // Delete vote
      queryClient.setQueryData(communityQueryOption.queryKey, {
        ...existingCommunity,
        posts: existingCommunity.posts.map((p) =>
          p.id === post.id
            ? {
                ...p,
                userVote: null,
                upvotes: value === 1 ? p.upvotes - 1 : p.upvotes,
                downvotes: value === -1 ? p.downvotes - 1 : p.downvotes,
              }
            : p
        ),
      });

      queryClient.setQueryData(getPost.queryKey, {
        ...existingPost,
        userVote: null,
        upvotes: value === 1 ? post.upvotes - 1 : post.upvotes,
        downvotes: value === -1 ? post.downvotes - 1 : post.downvotes,
      });

      return await deleteVote(post.id);
    }

    if (post.userVote && post.userVote !== value) {
      // Update vote
      queryClient.setQueryData(communityQueryOption.queryKey, {
        ...existingCommunity,
        posts: existingCommunity.posts.map((p) =>
          p.id === post.id
            ? {
                ...p,
                userVote: value,
                upvotes: value === 1 ? p.upvotes + 1 : p.upvotes - 1,
                downvotes: value === -1 ? p.downvotes + 1 : p.downvotes - 1,
              }
            : p
        ),
      });

      queryClient.setQueryData(getPost.queryKey, {
        ...existingPost,
        userVote: value,
        upvotes: value === 1 ? post.upvotes + 1 : post.upvotes - 1,
        downvotes: value === -1 ? post.downvotes + 1 : post.downvotes - 1,
      });

      return await updateVote(post.id, value);
    }

    // Create vote
    queryClient.setQueryData(communityQueryOption.queryKey, {
      ...existingCommunity,
      posts: existingCommunity.posts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              userVote: value,
              upvotes: value === 1 ? p.upvotes + 1 : p.upvotes,
              downvotes: value === -1 ? p.downvotes + 1 : p.downvotes,
            }
          : p
      ),
    });

    queryClient.setQueryData(getPost.queryKey, {
      ...existingPost,
      userVote: value,
      upvotes: value === 1 ? post.upvotes + 1 : post.upvotes,
      downvotes: value === -1 ? post.downvotes + 1 : post.downvotes,
    });

    return await createVote(post.id, value);
  };

  const mutation = useMutation({
    mutationFn: handleVote,
    onError: () => {
      toast.error("Error", { description: `Failed to vote` });
      // invalidate the query to refetch the data
      queryClient.invalidateQueries(communityQueryOption);
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
        className={`rounded-full hover:text-green-500 ${post.userVote === 1 ? "text-green-500" : ""}`}
        onClick={() => mutation.mutate(1)}
        disabled={mutation.isPending}
      >
        <ThumbsUp />
      </Button>

      <span className="text-center text-sm">
        {post.upvotes - post.downvotes}
      </span>

      <Button
        variant={"ghost"}
        className={`rounded-full hover:text-red-500 ${post.userVote === -1 ? "text-red-500" : ""}`}
        onClick={() => mutation.mutate(-1)}
        disabled={mutation.isPending}
      >
        <ThumbsDown />
      </Button>
    </div>
  );
}
