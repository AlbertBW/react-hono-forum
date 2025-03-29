import { getTimeAgo } from "@/lib/utils";
import {
  ArrowBigDown,
  ArrowBigUp,
  ChevronDown,
  ChevronUp,
  Trash,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import CreateComment from "./create-comment";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  deleteComment,
  loadingCreateCommentQueryOptions,
  type Comment,
} from "@/api/comment.api";
import VoteComment from "./comment-vote";
import { Link } from "@tanstack/react-router";
import Comments from "./comments";
import { type CreateComment as CreateCommentType } from "../../../../server/db/schema";
import { Skeleton } from "../ui/skeleton";
import { useSession } from "@/lib/auth-client";
import { LoadingSpinner } from "../ui/spinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCommunityQueryOptions } from "@/api/community.api";
import { toast } from "sonner";
import { getSingleThreadQueryOptions } from "@/api/thread.api";

export default function CommentCard({
  comment,
  threadId,
  communityName,
}: {
  comment: Comment;
  threadId: string;
  communityName: string;
}) {
  const { data: session } = useSession();
  const [createCommentOpen, setCreateCommentOpen] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const { data: loadingNewComment } = useQuery(
    loadingCreateCommentQueryOptions
  );
  const { data: community } = useQuery(getCommunityQueryOptions(communityName));
  const { data: thread } = useQuery(getSingleThreadQueryOptions(threadId));

  const openReplies = () => {
    setRepliesOpen(true);
  };

  const userIsModOrCommenter =
    community?.moderators.some((mod) => mod.userId === session?.user.id) ||
    comment.userId === session?.user.id ||
    false;

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-1.5 w-full">
        <Avatar className={`size-8`}>
          {comment.avatar ? (
            <AvatarImage src={comment.avatar} alt={`${comment.username}`} />
          ) : (
            <AvatarFallback></AvatarFallback>
          )}
        </Avatar>
        {comment.userId ? (
          <Link
            className="text-xs text-accent-foreground hover:text-blue-200 font-semibold"
            to={"/user/$userId"}
            params={{ userId: comment.userId }}
          >
            {comment.username}
          </Link>
        ) : (
          <span className="text-xs text-accent-foreground font-semibold">
            [DELETED]
          </span>
        )}
        {comment.isModerator ? (
          <span className="text-green-600 text-xs">MOD</span>
        ) : thread && thread.userId === comment.userId ? (
          <span className="text-blue-500 text-xs">OP</span>
        ) : null}
        <span className="text-xs font-semibold text-muted-foreground">•</span>
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
        <div className="min-w-8"></div>
        <p className="text-accent-foreground/90 text-sm whitespace-pre-wrap">
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
          parentId={comment.parentId}
          disabled={!comment.userId}
        />
        <div className="flex gap-1.5 items-center text-accent-foreground/80">
          {!comment.parentId && (
            <Button
              disabled={!session}
              variant={"ghost"}
              className="text-muted-foreground hover:text-foreground rounded-full "
              onClick={() => setCreateCommentOpen(true)}
            >
              Reply
            </Button>
          )}
          {userIsModOrCommenter && comment.userId !== null && (
            <DeleteComment id={comment.id} />
          )}
        </div>
      </div>
      {!comment.parentId && createCommentOpen && (
        <div className="flex">
          <div className="h-1 w-6"></div>
          <div className="w-full">
            <CreateComment
              threadId={threadId}
              parentId={comment.id}
              close={() => setCreateCommentOpen(false)}
              openReplies={openReplies}
            />
          </div>
        </div>
      )}
      {comment.childrenCount > 0 && (
        <>
          <div className="flex gap-1.5 w-full">
            <div className="w-8"></div>
            <Button
              variant={"ghost"}
              className="text-blue-500 hover:text-blue-400 rounded-full"
              onClick={() => setRepliesOpen((prev) => !prev)}
            >
              {!repliesOpen ? <ChevronDown /> : <ChevronUp />}{" "}
              {comment.childrenCount} Replies
            </Button>
          </div>

          {repliesOpen && (
            <div className="flex gap-1.5 w-full mt-1">
              <div className="w-8"></div>
              <div className="w-full">
                {loadingNewComment?.comment?.parentId === comment.id && (
                  <CommentSkeleton comment={loadingNewComment.comment} />
                )}
                <Comments
                  threadId={threadId}
                  parentId={comment.id}
                  communityName={communityName}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function CommentSkeleton({ comment }: { comment?: CreateCommentType }) {
  const { data } = useSession();
  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-1.5 w-full">
        <Avatar className={`size-8`}>
          <AvatarFallback>
            <LoadingSpinner />
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-accent-foreground hover:text-blue-200 font-semibold">
          {data?.user.name}
        </span>
        <span className="text-xs font-semibold text-muted-foreground">•</span>
        <span className="text-xs font-semibold text-muted-foreground">0m</span>
        <Skeleton />
      </div>
      <div className="flex gap-1.5 w-full pb-0.5">
        <div className="w-8"></div>
        <p className="text-accent-foreground/80 text-sm whitespace-pre">
          {comment?.content}
        </p>
      </div>
      <div className="flex gap-1.5 w-full">
        <div className="w-6"></div>
        <div className="flex gap-1.5 justify-center items-center text-accent-foreground/80">
          <Button
            className={`rounded-full size-8 hover:text-green-500`}
            variant={"ghost"}
            size={"icon"}
            disabled={true}
          >
            <ArrowBigUp className="size-6" />
          </Button>
          <span className="text-sm">1</span>
          <Button
            className={`rounded-full size-8 hover:text-red-500`}
            variant={"ghost"}
            size={"icon"}
            disabled={true}
          >
            <ArrowBigDown className="size-6" />
          </Button>
        </div>
        {!comment?.parentId && (
          <Button
            variant={"ghost"}
            className="text-muted-foreground hover:text-foreground rounded-full "
            disabled={true}
          >
            Reply
          </Button>
        )}
      </div>
    </div>
  );
}

function DeleteComment({ id }: { id: string }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteComment,
    onError: () => {
      toast.error("Failed to delete comment");
    },
    onSuccess: () => {
      toast.success("Comment deleted");
      setConfirmDelete(false);
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
  return (
    <>
      {confirmDelete ? (
        <>
          <Button
            variant={"outline"}
            size={"icon"}
            className="size-8"
            onClick={() => setConfirmDelete(false)}
          >
            <Undo2 />
          </Button>
          <Button
            variant={"outline"}
            size={"icon"}
            className="text-red-500 hover:text-red-400 size-8 border-red-500"
            onClick={() => {
              mutation.mutate(id);
            }}
          >
            <Trash />
          </Button>
        </>
      ) : (
        <Button
          variant={"link"}
          className="text-red-500 hover:text-red-400 rounded-full"
          onClick={() => setConfirmDelete(true)}
        >
          Delete
        </Button>
      )}
    </>
  );
}
