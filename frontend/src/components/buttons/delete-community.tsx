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
import { toast } from "sonner";
import { LoadingSpinner } from "../ui/spinner";
import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { deleteCommunity } from "@/api/community.api";

export default function DeleteThread({ id }: { id: string }) {
  const navigate = useNavigate();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteCommunity,
    onError: (error) => {
      triggerRef.current?.click();
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : `Failed to delete community`,
      });
    },
    onSuccess: () => {
      triggerRef.current?.click();
      navigate({ to: `/` });
      toast.success(`Community deleted`, {
        description: `Successfully deleted community!`,
      });
      queryClient.invalidateQueries({ queryKey: ["get-infinite-communities"] });
      queryClient.invalidateQueries({ queryKey: ["get-community"] });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"destructive"}>Delete Community</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Are you sure you want to delete this community?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete this
            community and remove all data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogTrigger ref={triggerRef} asChild>
            <Button variant={"outline"}>Cancel</Button>
          </DialogTrigger>
          <Button
            onClick={() => mutation.mutate(id)}
            variant={"destructive"}
            type="submit"
          >
            {mutation.isPending ? <LoadingSpinner /> : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
