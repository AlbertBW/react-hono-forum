import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { getTimeAgo } from "@/lib/utils";
import { Button } from "./ui/button";
import VoteButtons from "./buttons/vote-buttons";
import type { ThreadCardType } from "@/api/thread.api";
import { JoinButton } from "./buttons/join-leave-community";
import { useSession } from "@/lib/auth-client";

type ThreadViewContext = "all" | "community";

export default function ThreadCard({
  thread,
  isMod,
  viewContext = "community",
}: {
  thread: ThreadCardType;
  isMod?: boolean;
  viewContext?: ThreadViewContext;
}) {
  const { data: userSession } = useSession();
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
            {thread.userAvatar ? (
              <AvatarImage
                src={thread.userAvatar}
                alt={`${thread.username} avatar`}
              />
            ) : (
              thread.communityIcon && (
                <AvatarImage
                  src={thread.communityIcon}
                  alt={`${thread.communityName} icon`}
                />
              )
            )}
            <AvatarFallback>
              <Skeleton />
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-row items-center gap-1">
            <Link
              to={viewContext === "community" ? "/profile" : "/c/$name"}
              params={{ name: thread.communityName }}
              className="text-xs font-semibold text-muted-foreground hover:underline"
            >
              {viewContext === "community"
                ? thread.username || "Anonymous"
                : `c/${thread.communityName}`}
            </Link>
            {isMod && <span className="text-green-600 text-xs">MOD</span>}
            {userSession && viewContext === "all" && !thread.userFollow && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <JoinButton
                  id={thread.communityId}
                  name={thread.communityName}
                  className="text-xs p-0 m-0 h-6 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-500"
                />
              </div>
            )}
            <span className="text-xs font-semibold text-muted-foreground">
              •
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {getTimeAgo(thread.createdAt)}
            </span>
          </div>
        </div>

        <div>
          <span className="text-base sm:text-lg font-semibold">
            {thread.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <VoteButtons
            communityName={thread.communityName}
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
