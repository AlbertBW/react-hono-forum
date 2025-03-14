import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut, useSession } from "@/lib/auth-client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteAccount } from "@/api/user.api";

export const Route = createFileRoute("/user/$userId/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: session } = useSession();

  const { userId } = Route.useParams();

  if (session?.user?.id !== userId) {
    return <div>Unauthorized</div>;
  }

  return (
    <div>
      <Card className="border-red-800">
        <CardHeader>
          <CardTitle className="text-red-500">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            These actions are destructive and cannot be undone.
          </p>
          <DeleteAccount />
        </CardContent>
      </Card>
    </div>
  );
}

function DeleteAccount() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  const [veryifyEmail, setVerifyEmail] = useState("");
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: deleteAccount,
    onError: (error) => {
      triggerRef.current?.click();
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : `Failed to delete your account, please try again later.`,
      });
    },
    onSuccess: async () => {
      await signOut();
      queryClient.invalidateQueries({ queryKey: ["get-infinite-communities"] });
      queryClient.invalidateQueries({ queryKey: ["get-community"] });
      queryClient.invalidateQueries({ queryKey: ["get-user"] });
      triggerRef.current?.click();
      navigate({ to: `/` });
      toast.success(`Account deleted`, {
        description: `Successfully deleted your account!`,
      });
    },
  });

  if (!session) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"destructive"}>Delete your account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Are you sure you want to delete your account?
          </DialogTitle>
          <DialogDescription>
            This will permanently delete your account. Your profile will be
            removed, but your posts and comments will remain on the site without
            your name. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="verify-email" className="text-sm font-medium">
                Type your email to confirm
              </label>
              <Input
                id="verify-email"
                placeholder={"your email"}
                value={veryifyEmail}
                onChange={(e) => setVerifyEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason for leaving (optional)
              </label>
              <Textarea
                id="reason"
                placeholder="Tell us why you're deleting your account..."
                minLength={3}
                maxLength={100}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogTrigger ref={triggerRef} asChild>
            <Button variant={"outline"}>Cancel</Button>
          </DialogTrigger>
          <Button
            onClick={() => mutation.mutate(reason !== "" ? reason : undefined)}
            variant={"destructive"}
            type="submit"
            disabled={veryifyEmail !== session.user.email}
          >
            {mutation.isPending ? <LoadingSpinner /> : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
