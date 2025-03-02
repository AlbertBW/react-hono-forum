import VoteButtons from "@/components/buttons/vote-buttons";
import Aside from "@/components/layout/aside";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { randomGradient } from "@/lib/common-styles";
import { getTimeAgo } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  insertCommentSchema,
  type CreateComment,
} from "../../../../../server/db/schema";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FieldInfo from "@/components/field-info";
import { toast } from "sonner";
import { createComment, getCommentsQueryOptions } from "@/api/comment.api";
import { getCommunityQueryOptions } from "@/api/community.api";
import { getThreadQueryOptions } from "@/api/thread.api";

export const Route = createFileRoute("/c/$name/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { name, id } = Route.useParams();
  const communityQueryOption = getCommunityQueryOptions(name);
  const { data: community } = useQuery(communityQueryOption);

  const getThread = getThreadQueryOptions(id);
  const { isPending, error, data: thread } = useQuery(getThread);

  const navigate = useNavigate();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!thread || !community) {
    return <div>Thread not found</div>;
  }

  return (
    <div className="flex p-4  max-w-6xl mx-auto">
      <main className="w-full px-4">
        <div className="w-full gap-2 flex">
          <Button
            variant={"outline"}
            className="flex items-center gap-2 rounded-full size-10"
            onClick={() => navigate({ to: "/c/$name", params: { name } })}
          >
            <ArrowLeft />
          </Button>

          {community && community.icon ? (
            <Avatar className={`size-9`}>
              <AvatarImage
                src={community.icon}
                alt={`${community.name} icon`}
              />
            </Avatar>
          ) : (
            <Avatar
              className={`flex justify-center size-9 items-center bg-black`}
            >
              <AvatarFallback className={randomGradient()}></AvatarFallback>
            </Avatar>
          )}

          <div className="flex flex-col justify-evenly">
            <div className="flex items-center gap-1">
              <Link
                className="text-xs font-semibold text-accent-foreground/80 hover:text-blue-200"
                to={"/c/$name"}
                params={{ name }}
              >
                {community.name}
              </Link>
              <span className="text-xs font-semibold text-muted-foreground">
                •
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {getTimeAgo(thread.createdAt)}
              </span>
            </div>
            <Link
              className="text-xs text-accent-foreground/70 hover:text-blue-200"
              to={"/c/$name"}
              params={{ name }}
            >
              {thread.username}
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-4 pt-1">
          <h2 className="text-3xl font-semibold">{thread.title}</h2>
          <p>{thread.content}</p>
        </div>
        <div className="flex items-center gap-2 py-6">
          <VoteButtons
            communityName={thread.communityName!}
            downvotes={thread.downvotes}
            threadId={thread.id}
            upvotes={thread.upvotes}
            userVote={thread.userVote}
          />
          <div>
            <Button
              variant={"ghost"}
              className="text-muted-foreground hover:text-foreground rounded-full"
            >
              {thread.commentsCount} Comments
            </Button>
          </div>
        </div>

        <CreateComment threadId={thread.id} />
        <Comments threadId={thread.id} />
      </main>
      <Aside community={community} header button />
    </div>
  );
}

function CreateComment({
  threadId,
  parentId,
}: {
  threadId: string;
  parentId?: string;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const dialogRef = useRef<HTMLButtonElement>(null);

  const form = useForm({
    validators: {
      onChange: insertCommentSchema,
    },
    defaultValues: {
      threadId,
      content: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await createComment(threadId, value.content, parentId);
        // queryClient.invalidateQueries(getCommentsQueryOptions(threadId));
        toast.success("Comment created", {
          description: `Successfully created comment`,
        });
        form.reset();
        setFormOpen(false);
      } catch {
        toast.error("Error", { description: "Failed to create new comment" });
      }
    },
  });

  return (
    <>
      <Dialog>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          {" "}
          <form.Field
            name="content"
            children={(field) => (
              <>
                <Textarea
                  name={field.name}
                  onClick={() => {
                    setFormOpen(true);
                  }}
                  placeholder="Write a comment..."
                  className={`${!formOpen ? "resize-none min-h-10" : "min-h-16 field-sizing-content"} whitespace-pre-line`}
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />

                {formOpen && <FieldInfo field={field} />}
              </>
            )}
          />
          {formOpen && (
            <div className="flex py-2 justify-end gap-3">
              <Button
                type="button"
                variant={"outline"}
                onClick={() => {
                  if (form.state.values.content !== "") {
                    dialogRef.current?.click();
                    return;
                  }
                  setFormOpen(false);
                }}
                disabled={form.state.isSubmitting}
              >
                Cancel
              </Button>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? "..." : "Submit"}
                  </Button>
                )}
              />
            </div>
          )}
        </form>

        <DialogTrigger ref={dialogRef}></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard comment?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant={"outline"}
              onClick={() => {
                dialogRef.current?.click();
              }}
            >
              Cancel
            </Button>
            <Button
              variant={"destructive"}
              onClick={() => {
                setFormOpen(false);
                dialogRef.current?.click();
                document.querySelector("textarea")?.classList.add("h-10");
                form.reset();
              }}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Comments({ threadId }: { threadId: string }) {
  const {
    isPending,
    error,
    data: comments,
  } = useQuery(getCommentsQueryOptions(threadId));

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!comments || comments.length === 0) {
    return <div>No comments</div>;
  }

  return null;
}
