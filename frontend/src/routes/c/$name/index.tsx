import PostCard from "@/components/post-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  getCommunityQueryOptions,
  joinCommunity,
  leaveCommunity,
} from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { randomBanner } from "@/lib/common-styles";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Cake, Globe, Lock, Plus } from "lucide-react";
import { Fragment } from "react/jsx-runtime";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CommunityId } from "../../../../../server/shared-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/c/$name/")({
  component: CommunityPage,
});

function CommunityPage() {
  const { name } = Route.useParams();
  const { data: userData, isPending: userPending } = useSession();
  const communityQueryOption = getCommunityQueryOptions(name);
  const { isPending, error, data } = useQuery(communityQueryOption);
  const navigate = useNavigate();

  if (error) {
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
  const banner = randomBanner();

  const { community, posts } = data || {};

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
                className={`flex justify-center items-center size-14 md:size-20 lg:size-26 text-xl bg-black`}
              >
                <AvatarFallback>
                  {community && community.name ? (
                    community.name.substring(0, 3).toUpperCase()
                  ) : (
                    <Skeleton />
                  )}
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
                navigate({ to: `/c/${community.name}/create-post` })
              }
              variant={"outline"}
            >
              <Plus />
              Create Post
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
          {isPending ? (
            <div className="flex flex-col justify-center items-center w-full gap-4 mt-4">
              <LoadingSpinner />
            </div>
          ) : posts && posts.length > 0 ? (
            <>
              <Separator />
              {posts.map((post) => (
                <Fragment key={post.id}>
                  <PostCard post={post} />
                  <Separator />
                </Fragment>
              ))}
            </>
          ) : (
            <div className="flex flex-col gap-4 mt-4">
              <h3 className="text-lg font-bold">No Posts Yet</h3>
              <p className="text-sm text-muted-foreground">
                Be the first to post in this community!
              </p>
            </div>
          )}
        </main>
        {isPending ? null : community ? (
          <aside className="sticky top-18 self-start lg:w-md h-fit ml-2 hidden md:block">
            <Card className="py-3">
              <CardHeader className="px-4">
                <CardTitle className="text-base text-accent-foreground/80">
                  c/{community?.name}
                </CardTitle>
                <CardDescription>{community?.description}</CardDescription>
              </CardHeader>
              <CardContent className="px-4">
                <div className="text-xs text-muted-foreground flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Cake size={20} />
                    <span>
                      Created{" "}
                      {new Date(community.createdAt)
                        .toDateString()
                        .split(" ")
                        .slice(1)
                        .join(" ")}
                    </span>
                  </div>
                  {community.isPrivate ? (
                    <div className="flex items-center gap-2">
                      <Lock size={20} />
                      <span>Private</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Globe size={20} />
                      <span>Public</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2">
                  <div className="flex flex-col py-4 w-fit">
                    <span>{community.userCount}</span>
                    <span className="text-sm text-muted-foreground">
                      Member{community.userCount > 1 && "s"}
                    </span>
                  </div>
                  <div className="flex flex-col py-4">
                    <span>{community.postCount}</span>
                    <span className="text-sm text-muted-foreground">
                      Post{community.userCount > 1 && "s"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function JoinButton({ id, name }: { id: CommunityId; name: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: joinCommunity,
    onError: () => {
      toast.error("Error", { description: `Failed to join ${name}` });
    },
    onSuccess: async () => {
      toast.success(`Joined ${name}`, {
        description: `Successfully joined ${name}!`,
      });

      const existingData = await queryClient.ensureQueryData(
        getCommunityQueryOptions(name)
      );

      queryClient.setQueryData(getCommunityQueryOptions(name).queryKey, {
        ...existingData,
        community: {
          ...existingData.community,
          isFollowing: true,
        },
      });
    },
  });
  return (
    <Button
      className="w-18"
      disabled={mutation.isPending || !id}
      onClick={() => mutation.mutate(id)}
    >
      {mutation.isPending ? <LoadingSpinner /> : "Join"}
    </Button>
  );
}

function LeaveCommunity({ id, name }: { id: CommunityId; name: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: leaveCommunity,
    onError: () => {
      toast.error("Error", { description: `Failed to leave ${name}` });
    },
    onSuccess: async () => {
      toast.success(`You've left ${name}`, {
        description: `Successfully left ${name}!`,
      });

      const existingData = await queryClient.ensureQueryData(
        getCommunityQueryOptions(name)
      );

      queryClient.setQueryData(getCommunityQueryOptions(name).queryKey, {
        ...existingData,
        community: {
          ...existingData.community,
          isFollowing: false,
        },
      });
    },
  });
  return (
    <Dialog>
      <DialogTrigger>
        <Button className="w-18" variant={"outline"}>
          Joined
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="pb-4">
          <DialogTitle>Are you sure you want to leave {name}?</DialogTitle>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant={"destructive"}
            className="w-18"
            disabled={mutation.isPending || !id}
            onClick={() => mutation.mutate(id)}
          >
            {mutation.isPending ? <LoadingSpinner /> : "Leave"}
          </Button>

          <DialogTrigger>
            <Button className="w-18" variant={"outline"}>
              Cancel
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
