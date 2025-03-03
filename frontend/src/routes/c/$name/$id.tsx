import VoteButtons from "@/components/buttons/vote-buttons";
import Aside from "@/components/layout/aside";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { randomGradient } from "@/lib/common-styles";
import { getTimeAgo } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowBigDown, ArrowBigUp, ArrowLeft } from "lucide-react";
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
import { useSession } from "@/lib/auth-client";
import {
  createCommentVote,
  deleteCommentVote,
  updateCommentVote,
} from "@/api/comment-vote.api";

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
    return null;
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
            <Avatar className={`size-10`}>
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
        const { error } = await createComment(
          threadId,
          value.content,
          parentId
        );
        if (error) {
          throw new Error(error.message);
        }
        // queryClient.invalidateQueries(getCommentsQueryOptions(threadId));
        form.reset();
        setFormOpen(false);
      } catch (error: unknown) {
        toast.error("Error", {
          description:
            error instanceof Error
              ? error.message
              : "Failed to create new comment",
        });
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
    return null;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!comments || comments.length === 0) {
    return <div>No comments</div>;
  }

  return (
    <section className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-4">
          <div className="flex flex-col gap-0.5 w-full">
            <div className="flex items-center gap-1.5 w-full">
              <Avatar className={`size-8`}>
                <AvatarFallback className={randomGradient()}></AvatarFallback>
              </Avatar>
              <Link
                className="text-xs text-accent-foreground hover:text-blue-200 font-semibold"
                to={"/user/$name"}
                params={{ name: comment.username }}
              >
                {comment.username}
              </Link>
              <span className="text-xs font-semibold text-muted-foreground">
                •
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {getTimeAgo(comment.createdAt)}
              </span>
              {comment.createdAt !== comment.updatedAt && (
                <>
                  <span className="text-xs font-semibold text-muted-foreground">
                    •
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Edited {getTimeAgo(comment.updatedAt)}
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-1.5 w-full pb-0.5">
              <div className="w-8"></div>
              <p className="text-accent-foreground/80 text-sm">
                {comment.content}
              </p>
            </div>
            <div className="flex gap-1.5 w-full">
              <div className="w-6"></div>
              <VoteComment
                commentId={comment.id}
                userVote={comment.userVote}
                threadId={threadId}
                upvotes={comment.upvotes}
                downvotes={comment.downvotes}
              />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}

function VoteComment({
  threadId,
  commentId,
  userVote,
  upvotes,
  downvotes,
}: {
  threadId: string;
  commentId: string;
  userVote: number | null;
  upvotes: number;
  downvotes: number;
}) {
  const { isPending: isSessionLoading, data: sessionData } = useSession();
  const queryClient = useQueryClient();
  const commentsQueryOptions = getCommentsQueryOptions(threadId);

  const handleVote = async (value: number) => {
    if (!sessionData) {
      toast.error("Error", { description: `You must be logged in to vote` });
      return;
    }
    const existingCommentArray =
      await queryClient.ensureQueryData(commentsQueryOptions);

    if (userVote === value) {
      // Delete vote
      queryClient.setQueryData(
        commentsQueryOptions.queryKey,
        existingCommentArray.map((c) =>
          c.id === commentId
            ? {
                ...c,
                userVote: null,
                upvotes: value === 1 ? c.upvotes - 1 : c.upvotes,
                downvotes: value === -1 ? c.downvotes - 1 : c.downvotes,
              }
            : c
        )
      );

      return await deleteCommentVote(commentId);
    }

    if (userVote && userVote !== value) {
      // Update vote
      queryClient.setQueryData(
        commentsQueryOptions.queryKey,
        existingCommentArray.map((c) =>
          c.id === commentId
            ? {
                ...c,
                userVote: value,
                upvotes: value === 1 ? c.upvotes + 1 : c.upvotes - 1,
                downvotes: value === -1 ? c.downvotes + 1 : c.downvotes - 1,
              }
            : c
        )
      );

      return await updateCommentVote(commentId, value);
    }

    // Create vote
    queryClient.setQueryData(
      commentsQueryOptions.queryKey,
      existingCommentArray.map((c) =>
        c.id === commentId
          ? {
              ...c,
              userVote: value,
              upvotes: value === 1 ? c.upvotes + 1 : c.upvotes,
              downvotes: value === -1 ? c.downvotes + 1 : c.downvotes,
            }
          : c
      )
    );

    return await createCommentVote(commentId, value);
  };

  const mutation = useMutation({
    mutationFn: handleVote,
    onError: (error) => {
      toast.error("Error", {
        description: error instanceof Error ? error.message : `Failed to vote`,
      });
      // invalidate the query to refetch the data
      queryClient.invalidateQueries(commentsQueryOptions);
      // queryClient.invalidateQueries(getThread);
    },
  });
  return (
    <div className="flex gap-1.5 justify-center items-center text-accent-foreground/80">
      <Button
        className={`rounded-full size-8 hover:text-green-500 ${userVote === 1 ? "text-green-600" : ""}`}
        variant={"ghost"}
        size={"icon"}
        onClick={() => mutation.mutate(1)}
        disabled={mutation.isPending || isSessionLoading}
      >
        <ArrowBigUp className="size-6" />
      </Button>
      <span className="text-sm">{upvotes - downvotes}</span>
      <Button
        className={`rounded-full size-8 hover:text-red-500 ${userVote === -1 ? "text-red-600" : ""}`}
        variant={"ghost"}
        size={"icon"}
        onClick={() => mutation.mutate(-1)}
        disabled={mutation.isPending || isSessionLoading}
      >
        <ArrowBigDown className="size-6" />
      </Button>
    </div>
  );
}
