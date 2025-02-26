import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableCaption,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  deletePost,
  getAllPostsQueryOptions,
  loadingCreatePostQueryOptions,
} from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import { PostId } from "../../../server/shared-types";
import { toast } from "sonner";

export const Route = createFileRoute("/posts")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isPending, error, data } = useQuery(getAllPostsQueryOptions);
  const { data: loadingCreatePost } = useQuery(loadingCreatePostQueryOptions);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <>
      <h1>Posts</h1>
      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Delete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingCreatePost?.post && (
            <TableRow>
              <TableCell>
                <Skeleton className="h-4" />
              </TableCell>
              <TableCell>{loadingCreatePost.post.title}</TableCell>
              <TableCell>{loadingCreatePost.post.content}</TableCell>
              <TableCell>
                <Skeleton className="h-4" />
              </TableCell>
            </TableRow>
          )}
          {isPending
            ? Array(3)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4" />
                    </TableCell>
                  </TableRow>
                ))
            : data.posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>{post.id}</TableCell>
                  <TableCell>{post.title}</TableCell>
                  <TableCell>{post.content}</TableCell>
                  <TableCell>
                    <PostDeleteButton id={post.id} />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </>
  );
}

function PostDeleteButton({ id }: { id: PostId }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deletePost,
    onError: () => {
      toast.error("Error", { description: `Failed to delete post: ${id}` });
    },
    onSuccess: () => {
      toast.success("Post deleted", {
        description: `Successfully deleted post: ${id}`,
      });

      queryClient.setQueryData(
        getAllPostsQueryOptions.queryKey,
        (existingPosts) => ({
          ...existingPosts,
          posts: existingPosts!.posts.filter((p) => p.id !== id),
        }),
      );
    },
  });
  return (
    <Button
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(id)}
      variant={"outline"}
      size={"icon"}
      className="cursor-pointer"
    >
      {mutation.isPending ? (
        <Skeleton className="h-4 w-4" />
      ) : (
        <Trash className="h-4 w-4" />
      )}
    </Button>
  );
}
