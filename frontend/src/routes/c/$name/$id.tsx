import VoteButtons from "@/components/buttons/vote-buttons";
import Aside from "@/components/layout/aside";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { randomGradient } from "@/lib/common-styles";
import { getTimeAgo } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getCommunityQueryOptions } from "@/api/community.api";
import { getSingleThreadQueryOptions } from "@/api/thread.api";
import CreateComment from "@/components/comments/create-comment";
import Comments from "@/components/comments/comments";
import { useSession } from "@/lib/auth-client";
import DeleteThread from "@/components/buttons/delete-thread";
import { useRef } from "react";

export const Route = createFileRoute("/c/$name/$id")({
  component: ThreadPage,
});

function ThreadPage() {
  const { data: session } = useSession();
  const { name, id } = Route.useParams();
  const communityQueryOption = getCommunityQueryOptions(name);
  const { data: community } = useQuery(communityQueryOption);
  const {
    isPending,
    error,
    data: thread,
  } = useQuery(getSingleThreadQueryOptions(id));
  const commentsRef = useRef<HTMLDivElement>(null);

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

  const postedByMod = community.moderators.some(
    (mod) => mod.userId === thread.userId
  );

  return (
    <div className="flex p-1 pt-4 sm:p-4 max-w-6xl mx-auto">
      <main className="w-full px-2 sm:px-4">
        <div className="w-full gap-2 flex">
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
              {thread.userId ? (
                <Link
                  className="text-xs text-accent-foreground/70 hover:text-blue-200"
                  to={"/user/$userId"}
                  params={{ userId: thread.userId }}
                >
                  {thread.username}{" "}
                  {postedByMod && <span className="text-green-600">MOD</span>}
                </Link>
              ) : (
                <span className="text-xs text-accent-foreground/70">
                  [DELETED]
                </span>
              )}
            </div>
          </div>
          {session &&
            (community.moderators.some(
              (mod) => mod.userId === session.user.id
            ) ||
              thread.userId === session.user.id) && (
              <div>
                <DeleteThread id={thread.id} communityName={community.name} />
              </div>
            )}
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
              onClick={() => {
                commentsRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
            >
              {thread.commentsCount} Comments
            </Button>
          </div>
        </div>

        <div ref={commentsRef}>
          <CreateComment threadId={thread.id} />
        </div>
        <section className="space-y-3 pt-6">
          <Comments threadId={thread.id} communityName={name} />
        </section>
      </main>
      <Aside community={community} header button />
    </div>
  );
}
