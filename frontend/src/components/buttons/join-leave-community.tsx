import {
  joinCommunity,
  getCommunityQueryOptions,
  leaveCommunity,
} from "@/lib/api";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CommunityId } from "../../../../server/db/schema";
import { Button } from "../ui/button";
import { DialogHeader, DialogFooter } from "../ui/dialog";
import { LoadingSpinner } from "../ui/spinner";

export function JoinButton({ id, name }: { id: CommunityId; name: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: joinCommunity,
    onError: () => {
      toast.error("Error", { description: `Failed to join ${name}` });
    },
    onSuccess: async () => {
      toast.success(`Joined ${name}`, {
        description: `Successfully joined ${name}!`,
      });

      const existingData = await queryClient.ensureQueryData(
        getCommunityQueryOptions(name)
      );

      queryClient.setQueryData(getCommunityQueryOptions(name).queryKey, {
        ...existingData,
        community: {
          ...existingData.community,
          isFollowing: true,
        },
      });
    },
  });
  return (
    <Button
      className="w-18"
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
}: {
  id: CommunityId;
  name: string;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: leaveCommunity,
    onError: () => {
      toast.error("Error", { description: `Failed to leave ${name}` });
    },
    onSuccess: async () => {
      toast.success(`You've left ${name}`, {
        description: `Successfully left ${name}!`,
      });

      const existingData = await queryClient.ensureQueryData(
        getCommunityQueryOptions(name)
      );

      queryClient.setQueryData(getCommunityQueryOptions(name).queryKey, {
        ...existingData,
        community: {
          ...existingData.community,
          isFollowing: false,
        },
      });
    },
  });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-18" variant={"outline"}>
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
