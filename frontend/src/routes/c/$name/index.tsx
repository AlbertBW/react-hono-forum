import ThreadCard from "@/components/thread-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";
import { randomGradient } from "@/lib/common-styles";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Fragment } from "react/jsx-runtime";
import Aside from "@/components/layout/aside";
import {
  JoinButton,
  LeaveCommunity,
} from "@/components/buttons/join-leave-community";
import { getCommunityQueryOptions } from "@/api/community.api";
import { getThreadsQueryOptions } from "@/api/thread.api";

export const Route = createFileRoute("/c/$name/")({
  component: CommunityPage,
});

function CommunityPage() {
  const { name } = Route.useParams();
  const { data: userData, isPending: userPending } = useSession();
  const communityQueryOption = getCommunityQueryOptions(name);
  const threadsQueryOptions = getThreadsQueryOptions(name);
  const { isPending, error, data: community } = useQuery(communityQueryOption);
  const {
    isPending: threadPending,
    error: threadError,
    data: initialThreads,
  } = useQuery(threadsQueryOptions);
  const navigate = useNavigate();

  if (error || (!isPending && !community)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <h1 className="text-4xl font-bold mb-4">Community Not Found</h1>
        <p className="text-lg text-muted-foreground mb-8">
          The community "{name}" doesn't exist or has been removed.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }
  const banner = randomGradient();
  const background = randomGradient();

  return (
    <div className="sm:p-4 max-w-7xl mx-auto">
      <div
        className={`w-full h-18 md:h-32 sm:rounded-md ${isPending ? "bg-zinc-900 animate-pulse" : banner}`}
      ></div>
      <section className="-translate-y-1/5 sm:-translate-y-2/5 px-4 min-h-20 flex flex-col sm:flex-row justify-between w-full sm:items-end gap-2 sm:gap-4">
        <div className="flex items-end gap-2">
          <div className="border-3 size-fit rounded-full border-black">
            {isPending ? (
              <Avatar className={`size-14 md:size-20 lg:size-26 bg-black`}>
                <AvatarFallback>
                  <Skeleton className="h-full w-full rounded-full" />
                </AvatarFallback>
              </Avatar>
            ) : community && community.icon ? (
              <Avatar className={`size-14 md:size-20 lg:size-26`}>
                <AvatarImage
                  src={community.icon}
                  alt={`${community.name} icon`}
                />
              </Avatar>
            ) : (
              <Avatar
                className={`flex justify-center items-center size-14 md:size-20 lg:size-26 text-xl `}
              >
                <AvatarFallback className={`${background}`}>
                  <Skeleton />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl lg:text-4xl font-bold">
              {isPending ? (
                <Skeleton className="h-8 w-32 md:h-6 md:w-40 lg:h-8 lg:w-48" />
              ) : (
                community?.name
              )}
            </h2>
          </div>
        </div>
        {!userPending && userData && community && (
          <div className="flex justify-end sm:items-end gap-4">
            <Button
              onClick={() =>
                navigate({ to: `/c/${community.name}/create-thread` })
              }
              variant={"outline"}
            >
              <Plus />
              Create Thread
            </Button>

            {isPending ? (
              <Skeleton className="h-8 w-18" />
            ) : (
              community &&
              (community.isFollowing ? (
                <LeaveCommunity id={community.id} name={community.name} />
              ) : (
                <JoinButton id={community.id} name={community.name} />
              ))
            )}
          </div>
        )}
      </section>

      <div className="flex relative">
        <main className="w-full">
          {threadPending ? (
            <div className="flex flex-col justify-center items-center w-full gap-4 mt-4"></div>
          ) : threadError ? (
            <div className="flex flex-col justify-center items-center w-full gap-4 mt-4">
              <h3 className="text-lg font-bold">Failed to Load threads</h3>
              <p className="text-sm text-muted-foreground">
                An error occurred while trying to load threads.
              </p>
            </div>
          ) : initialThreads && initialThreads.length > 0 ? (
            <>
              <Separator />
              {initialThreads.map((thread) => (
                <Fragment key={thread.id}>
                  <ThreadCard thread={thread} />
                  <Separator />
                </Fragment>
              ))}
            </>
          ) : (
            <div className="flex flex-col gap-4 mt-4">
              <h3 className="text-lg font-bold">No Threads Yet</h3>
              <p className="text-sm text-muted-foreground">
                {!userPending
                  ? userData
                    ? "Be the first to post in this community!"
                    : "Sign in to post in this community!"
                  : null}
              </p>
            </div>
          )}
        </main>
        {isPending ? null : community ? <Aside community={community} /> : null}
      </div>
    </div>
  );
}
