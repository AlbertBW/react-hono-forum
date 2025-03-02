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
import { loadingCreateThreadQueryOptions } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trash } from "lucide-react";
import { toast } from "sonner";
import { ThreadId } from "../../../server/db/schema";
import { getAllThreadsQueryOptions, deleteThread } from "@/api/thread.api";

export const Route = createFileRoute("/threads")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isPending, error, data } = useQuery(getAllThreadsQueryOptions);
  const { data: loadingCreateThread } = useQuery(
    loadingCreateThreadQueryOptions
  );

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <>
      <h1>Threads</h1>
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
          {loadingCreateThread?.thread && (
            <TableRow>
              <TableCell>
                <Skeleton className="h-4" />
              </TableCell>
              <TableCell>{loadingCreateThread.thread.title}</TableCell>
              <TableCell>{loadingCreateThread.thread.content}</TableCell>
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
            : data.threads.map((thread) => (
                <TableRow key={thread.id}>
                  <TableCell>{thread.id}</TableCell>
                  <TableCell>{thread.title}</TableCell>
                  <TableCell>{thread.content}</TableCell>
                  <TableCell>
                    <ThreadDeleteButton id={thread.id} />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </>
  );
}

function ThreadDeleteButton({ id }: { id: ThreadId }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteThread,
    onError: () => {
      toast.error("Error", { description: `Failed to delete thread: ${id}` });
    },
    onSuccess: () => {
      toast.success("Thread deleted", {
        description: `Successfully deleted thread: ${id}`,
      });

      queryClient.setQueryData(
        getAllThreadsQueryOptions.queryKey,
        (existingThreads) => ({
          ...existingThreads,
          posts: existingThreads!.posts.filter((t) => t.id !== id),
        })
      );
    },
  });
  return (
    <Button
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(id)}
      variant={"outline"}
      size={"icon"}
    >
      {mutation.isPending ? (
        <Skeleton className="h-4 w-4" />
      ) : (
        <Trash className="h-4 w-4" />
      )}
    </Button>
  );
}
