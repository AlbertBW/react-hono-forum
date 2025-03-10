import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useSession } from "@/lib/auth-client";
import { deleteModerator } from "@/api/community.api";
import { toast } from "sonner";

export default function RemoveMod({
  modId,
  communityId,
  name,
}: {
  modId: string;
  communityId: string;
  name: string;
}) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteModerator,
    onSuccess: () => {
      toast.success("Mod removed");
      queryClient.invalidateQueries({ queryKey: ["get-infinite-communities"] });
      queryClient.invalidateQueries({ queryKey: ["get-community"] });
    },
    onError: () => {
      toast.error("Failed to remove mod");
    },
  });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Remove</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Remove {session?.user.id === modId ? "yourself" : `${name}`} as mod?
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove {name} as a mod, this user will no
            longer have moderator permissions.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => {
              mutation.mutate({ modId, communityId });
            }}
            disabled={mutation.isPending}
          >
            Remove
          </Button>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => mutation.reset()}>
              Cancel
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
