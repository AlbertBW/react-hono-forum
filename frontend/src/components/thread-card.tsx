import { Link, useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { getTimeAgo } from "@/lib/utils";
import { Button } from "./ui/button";
import VoteButtons from "./buttons/vote-buttons";
import type { ThreadCardType } from "@/api/thread.api";
import { JoinButton } from "./buttons/join-leave-community";
import { useSession } from "@/lib/auth-client";
import { MessageCircle } from "lucide-react";

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
  const navigate = useNavigate();
  if (!thread.communityName) {
    throw new Error("Community name is required");
  }

  return (
    <article className="pb-0 sm:pb-1 pt-1 px-2 md:px-0 hover:cursor-pointer">
      <Link
        to={"/c/$name/$id"}
        params={{ name: thread.communityName, id: thread.id }}
        className="flex flex-col gap-2 p-2 hover:bg-muted/20 rounded-xl"
      >
        <div className="flex items-center gap-2 ">
          {thread.userAvatar && thread.userId ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                navigate({
                  to: `/user/$userId`,
                  params: { userId: thread.userId! },
                });
              }}
            >
              <Avatar
                className={`flex justify-center items-center size-5 bg-black hover:cursor-pointer`}
              >
                <AvatarImage
                  src={thread.userAvatar}
                  alt={`${thread.username} avatar`}
                />
                <AvatarFallback>
                  <Skeleton />
                </AvatarFallback>
              </Avatar>
            </button>
          ) : thread.communityIcon ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                navigate({
                  to: `/c/$name`,
                  params: { name: thread.communityName },
                });
              }}
            >
              <Avatar
                className={`flex justify-center items-center size-5 bg-black hover:cursor-pointer`}
              >
                <AvatarImage
                  src={thread.communityIcon}
                  alt={`${thread.communityName} icon`}
                />
                <AvatarFallback>
                  <Skeleton />
                </AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <Avatar
              className={`flex justify-center items-center size-5 bg-black`}
            >
              <AvatarFallback>
                <Skeleton />
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex flex-row items-center gap-1">
            {viewContext === "community" ? (
              thread.userId ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    navigate({
                      to: `/user/$userId`,
                      params: { userId: thread.userId! },
                    });
                  }}
                  className="text-xs font-semibold text-muted-foreground hover:underline hover:cursor-pointer"
                >
                  {thread.username || "Anonymous"}
                </button>
              ) : (
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {`[deleted]`}
                  </span>
                </div>
              )
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  navigate({
                    to: `/c/$name`,
                    params: { name: thread.communityName },
                  });
                }}
                className="text-xs font-semibold text-muted-foreground hover:underline hover:cursor-pointer"
              >
                c/{thread.communityName}
              </button>
            )}

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
          <span className="text-sm sm:text-lg font-semibold">
            {thread.title}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          <VoteButtons
            downvotes={thread.downvotes}
            threadId={thread.id}
            upvotes={thread.upvotes}
            userVote={thread.userVote}
          />
          <div>
            <Button
              variant={"ghost"}
              className="text-muted-foreground hover:text-foreground rounded-full hidden sm:block"
            >
              {thread.commentsCount} Comments
            </Button>

            <Button
              variant={"ghost"}
              className="rounded-full sm:hidden bg-secondary text-xs"
            >
              <MessageCircle /> {thread.commentsCount}
            </Button>
          </div>
        </div>
      </Link>
    </article>
  );
}
