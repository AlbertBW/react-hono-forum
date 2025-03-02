import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { getTimeAgo } from "@/lib/utils";
import { Button } from "./ui/button";
import VoteButtons from "./buttons/vote-buttons";
import type { ThreadCard } from "@/api/thread.api";

export default function ThreadCard({ thread }: { thread: ThreadCard }) {
  if (!thread.communityName) {
    throw new Error("Community name is required");
  }

  return (
    <article className="py-1">
      <Link
        to={"/c/$name/$id"}
        params={{ name: thread.communityName, id: thread.id }}
        className="flex flex-col gap-2 p-2 hover:bg-muted/20 rounded-xl"
      >
        <div className="flex items-center gap-2">
          <Avatar
            className={`flex justify-center items-center size-5 bg-black`}
          >
            <AvatarFallback>
              <Skeleton />
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-row gap-1">
            <Link
              to={"/profile"}
              className="text-xs font-semibold text-muted-foreground hover:underline"
            >
              {thread.username || "Anonymous"}
            </Link>
            <span className="text-xs font-semibold text-muted-foreground">
              •
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {getTimeAgo(thread.createdAt)}
            </span>
          </div>
        </div>

        <div>
          <Link to={"/"} className="text-base sm:text-lg font-semibold">
            {thread.title}
          </Link>
        </div>

        <div className="flex items-center gap-2">
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
      </Link>
    </article>
  );
}
