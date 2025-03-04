import { randomGradient } from "@/lib/common-styles";
import { getTimeAgo } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import CreateComment from "./create-comment";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import type { Comment } from "@/api/comment.api";
import VoteComment from "./comment-vote";
import { Link } from "@tanstack/react-router";
import Comments from "./comments";

export default function CommentCard({
  comment,
  threadId,
}: {
  comment: Comment;
  threadId: string;
}) {
  const [createCommentOpen, setCreateCommentOpen] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-1.5 w-full">
        <Avatar className={`size-8`}>
          {comment.avatar ? (
            <AvatarImage src={comment.avatar} alt={`${comment.username}`} />
          ) : (
            <AvatarFallback className={randomGradient()}></AvatarFallback>
          )}
        </Avatar>
        <Link
          className="text-xs text-accent-foreground hover:text-blue-200 font-semibold"
          to={"/user/$username"}
          params={{ username: comment.username! }}
        >
          {comment.username}
        </Link>
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
        <div className="w-8"></div>
        <p className="text-accent-foreground/80 text-sm">{comment.content}</p>
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
        />
        {!comment.parentId && (
          <Button
            variant={"ghost"}
            className="text-muted-foreground hover:text-foreground rounded-full"
            onClick={() => setCreateCommentOpen(true)}
          >
            Reply
          </Button>
        )}
      </div>
      {!comment.parentId && createCommentOpen && (
        <div className="flex">
          <div className="h-1 w-6"></div>
          <div className="w-full">
            <CreateComment
              threadId={threadId}
              parentId={comment.id}
              close={() => setCreateCommentOpen(false)}
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
            <div className="flex gap-1.5 w-full">
              <div className="w-8"></div>
              <div className="w-full">
                <Comments threadId={threadId} parentId={comment.id} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
