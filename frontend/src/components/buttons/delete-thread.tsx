import { useMutation } from "@tanstack/react-query";
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
import { deleteThread } from "@/api/thread.api";
import { useNavigate } from "@tanstack/react-router";

export default function DeleteThread({
  id,
  communityName,
}: {
  id: string;
  communityName: string;
}) {
  const navigate = useNavigate();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const mutation = useMutation({
    mutationFn: deleteThread,
    onError: (error) => {
      triggerRef.current?.click();
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : `Failed to delete thread`,
      });
    },
    onSuccess: () => {
      triggerRef.current?.click();
      navigate({ to: `/c/$name`, params: { name: communityName } });
      toast.success(`Thread deleted`, {
        description: `Successfully deleted thread!`,
      });
    },
  });

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant={"destructive"}>Delete Thread</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this thread?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogTrigger ref={triggerRef}>
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
