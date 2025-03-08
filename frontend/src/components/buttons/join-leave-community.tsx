import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CommunityId } from "../../../../server/db/schema";
import { Button } from "../ui/button";
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { LoadingSpinner } from "../ui/spinner";
import {
  joinCommunity,
  getCommunityQueryOptions,
  leaveCommunity,
} from "@/api/community.api";
import { THREADS_PER_PAGE } from "@/lib/constants";
import {
  getSingleThreadQueryOptions,
  getThreadsInfiniteQueryOptions,
} from "@/api/thread.api";
import { useSession } from "@/lib/auth-client";

export function JoinButton({
  id,
  name,
  className,
}: {
  id: CommunityId;
  name: string;
  className?: string;
}) {
  const { data: sessionData } = useSession();
  const queryClient = useQueryClient();

  const handleMutation = async (id: CommunityId) => {
    if (!sessionData) {
      throw new Error("You need to be logged in to join a community");
    }
    await joinCommunity(id);
  };
  const mutation = useMutation({
    mutationFn: handleMutation,
    onError: (error) => {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : `Failed to join ${name}`,
      });
    },
    onSuccess: async () => {
      toast.success(`Joined ${name}`, {
        description: `Successfully joined ${name}!`,
      });

      queryClient.invalidateQueries(getCommunityQueryOptions(name));
      queryClient.invalidateQueries(
        getThreadsInfiniteQueryOptions(name, THREADS_PER_PAGE)
      );
      queryClient.invalidateQueries({
        queryKey: getThreadsInfiniteQueryOptions("all").queryKey,
      });
      queryClient.invalidateQueries(getSingleThreadQueryOptions(id));
    },
  });
  return (
    <Button
      className={className ? className : "w-18"}
      disabled={mutation.isPending || !id}
      onClick={() => mutation.mutate(id)}
    >
      {mutation.isPending ? <LoadingSpinner /> : "Join"}
    </Button>
  );
}

export function LeaveCommunity({
  id,
  name,
  className,
}: {
  id: CommunityId;
  name: string;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: leaveCommunity,
    onError: (error) => {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : `Failed to leave ${name}`,
      });
    },
    onSuccess: async () => {
      toast.success(`You've left ${name}`, {
        description: `Successfully left ${name}!`,
      });

      queryClient.invalidateQueries(getCommunityQueryOptions(name));
      queryClient.invalidateQueries(
        getThreadsInfiniteQueryOptions(name, THREADS_PER_PAGE)
      );
      queryClient.invalidateQueries(
        getThreadsInfiniteQueryOptions("all", THREADS_PER_PAGE)
      );
      queryClient.invalidateQueries(getSingleThreadQueryOptions(id));
    },
  });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className={className ? className : "w-18"} variant={"outline"}>
          Joined
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="pb-4">
          <DialogTitle>Are you sure you want to leave {name}?</DialogTitle>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant={"destructive"}
            className="w-18"
            disabled={mutation.isPending || !id}
            onClick={() => mutation.mutate(id)}
          >
            {mutation.isPending ? <LoadingSpinner /> : "Leave"}
          </Button>

          <DialogTrigger>
            <Button className="w-18" variant={"outline"}>
              Cancel
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
