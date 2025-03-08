import { Button } from "@/components/ui/button";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  createComment,
  getCommentsInfiniteQueryOptions,
  loadingCreateCommentQueryOptions,
} from "@/api/comment.api";
import { insertCommentSchema } from "../../../../server/db/schema";
import { COMMENTS_PER_PAGE, REPLIES_PER_COMMENT } from "@/lib/constants";
import { useSession } from "@/lib/auth-client";
import { getThreadsInfiniteQueryOptions } from "@/api/thread.api";

export default function CreateComment({
  threadId,
  parentId,
  close,
  openReplies,
}: {
  threadId: string;
  parentId?: string;
  close?: () => void;
  openReplies?: () => void;
}) {
  const [formOpen, setFormOpen] = useState(parentId ? true : false);
  const queryClient = useQueryClient();
  const dialogRef = useRef<HTMLButtonElement>(null);
  const { data: userData } = useSession();

  const form = useForm({
    validators: {
      onChange: insertCommentSchema,
    },
    defaultValues: {
      threadId,
      content: "",
    },
    onSubmit: async ({ value }) => {
      const limit = parentId ? REPLIES_PER_COMMENT : COMMENTS_PER_PAGE;
      const commentsQueryOptions = getCommentsInfiniteQueryOptions(
        threadId,
        limit,
        parentId ? parentId : undefined
      );
      const existingCommentArray =
        await queryClient.ensureInfiniteQueryData(commentsQueryOptions);
      const parentsCommentsQueryOptions = getCommentsInfiniteQueryOptions(
        threadId,
        COMMENTS_PER_PAGE
      );
      const existingParentCommentArray =
        await queryClient.ensureInfiniteQueryData(parentsCommentsQueryOptions);

      if (parentId) {
        queryClient.setQueryData(parentsCommentsQueryOptions.queryKey, () => ({
          pages: existingParentCommentArray.pages.map((page) =>
            page.map((comment) =>
              comment.id === parentId
                ? {
                    ...comment,
                    childrenCount: Number(comment.childrenCount) + 1,
                  }
                : comment
            )
          ),
          pageParams: existingParentCommentArray.pageParams,
        }));
      }

      if (openReplies) {
        openReplies();
      }
      if (close) {
        close();
      }
      setFormOpen(false);
      form.reset();
      try {
        if (!userData || !userData.user) {
          throw new Error("You must be logged in to comment");
        }

        queryClient.setQueryData(loadingCreateCommentQueryOptions.queryKey, {
          comment: { ...value, parentId },
        });

        const { data, error } = await createComment(
          threadId,
          value.content,
          parentId
        );
        if (error) {
          throw new Error(error.message);
        }

        const newArray = existingCommentArray?.pages.map((page, pageIndex) => {
          if (pageIndex === 0) {
            return [
              {
                ...data,
                userVote: 1,
                username: userData.user.name,
                avatar: userData.user.image || null,
                upvotes: 1,
                downvotes: 0,
                childrenCount: 0,
              },
              ...page,
            ];
          }
          return page;
        });

        queryClient.setQueryData(commentsQueryOptions.queryKey, () => ({
          pages: newArray,
          pageParams: existingCommentArray.pageParams,
        }));
      } catch (error: unknown) {
        queryClient.invalidateQueries(
          getCommentsInfiniteQueryOptions(
            threadId,
            parentId ? REPLIES_PER_COMMENT : COMMENTS_PER_PAGE,
            parentId
          )
        );
        toast.error("Error", {
          description:
            error instanceof Error
              ? error.message
              : "Failed to create new comment",
        });
      } finally {
        queryClient.setQueryData(loadingCreateCommentQueryOptions.queryKey, {});
        queryClient.invalidateQueries(getThreadsInfiniteQueryOptions("all"));
      }
    },
  });

  return (
    <Dialog>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="content"
          children={(field) => (
            <>
              <Textarea
                name={field.name}
                onClick={() => {
                  setFormOpen(true);
                }}
                placeholder={parentId ? "Reply to comment" : "Add a comment"}
                className={`${!formOpen ? "resize-none min-h-10" : "min-h-16 field-sizing-content"} whitespace-pre-line hover:ring-2 ring-accent-foreground/30`}
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />

              {formOpen && <FieldInfo field={field} />}
            </>
          )}
        />
        {formOpen && (
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant={"outline"}
              onClick={() => {
                if (form.state.values.content !== "") {
                  dialogRef.current?.click();
                  return;
                }
                if (close) {
                  close();
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

      <DialogTrigger ref={dialogRef} hidden></DialogTrigger>
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
              if (close) {
                close();
              }
            }}
          >
            Discard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
