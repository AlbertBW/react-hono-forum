import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { Input } from "../ui/input";
import { useRef, useState } from "react";
import { z } from "zod";
import { findUserByEmail, UserWithModerator } from "@/api/user.api";
import { Avatar } from "../ui/avatar";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createModerator } from "@/api/community.api";

export default function AddMod({ communityId }: { communityId: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [user, setUser] = useState<UserWithModerator>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const queryclient = useQueryClient();

  const findUser = async () => {
    if (email === user?.email) return;
    setError(undefined);
    setSuccess(undefined);
    setUser(undefined);
    // Find user by email
    const { success } = z
      .object({ email: z.string().email() })
      .safeParse({ email });

    if (!success) {
      setError("Invalid email");
      return;
    }

    const { error, data } = await findUserByEmail(email);
    if (error || !data) {
      setError(error);
      return;
    }

    setUser(data);
    setSuccess("User found!");
  };

  const mutation = useMutation({
    mutationFn: createModerator,
    onError: (error) => {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : `Failed to add moderator`,
      });
    },
    onSuccess: () => {
      toast.success("User added as moderator");
      queryclient.invalidateQueries({ queryKey: ["get-community"] });
      queryclient.invalidateQueries({ queryKey: ["get-all-communities"] });
      setEmail("");
      setUser(undefined);
      setSuccess(undefined);
      triggerRef.current?.click();
      mutation.reset();
    },
  });
  return (
    <Dialog>
      <DialogTrigger
        asChild
        ref={triggerRef}
        onClick={() => {
          mutation.reset();
          setEmail("");
          setError(undefined);
          setSuccess(undefined);
          setUser(undefined);
        }}
      >
        <Button variant={"outline"}>
          <Plus />
          Add Mod
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new moderator</DialogTitle>
          <DialogDescription>
            Enter the user's email to find and add them as a moderator.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Input
            type="email"
            placeholder="Email"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p className="text-red-500 pt-2">{error}</p>}
          {success && <p className="text-green-500 pt-2">{success}</p>}
          <Button
            className="mt-4"
            onClick={findUser}
            disabled={mutation.isPending}
          >
            Find
          </Button>
        </div>

        {user && (
          <div className="flex flex-col items-center space-y-4 mt-4 border border-secondary rounded-2xl p-6 bg-secondary dark:bg-secondary shadow-sm">
            <Avatar className="size-24 ring-2 ring-primary/20 shadow-md">
              {user.image && <AvatarImage src={user.image} alt={user.name} />}
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center space-y-1 text-center">
              <h3 className="font-medium text-lg">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {user.moderator.some((mod) => mod.communityId === communityId) ? (
              <p className="text-sm text-center font-medium text-green-500 bg-green-50 dark:bg-green-950/30 py-1 px-3 rounded-full">
                Already a moderator in this community
              </p>
            ) : (
              <Button
                className="mt-2 w-full"
                variant="default"
                onClick={() =>
                  mutation.mutate({ communityId, userId: user.id })
                }
                disabled={mutation.isPending}
              >
                Make Moderator
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
