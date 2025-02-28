import PostCard from "@/components/post-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/spinner";
import { getCommunityQueryOptions } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { randomBanner } from "@/lib/common-styles";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Fragment } from "react/jsx-runtime";

export const Route = createFileRoute("/c/$name")({
  component: CommunityPage,
});

function CommunityPage() {
  const { name } = Route.useParams();
  const { data: userData, isPending: userPending } = useSession();
  const communityQueryOption = getCommunityQueryOptions(name);
  const { isPending, error, data } = useQuery(communityQueryOption);

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

  const { communityData, postsData } = data || {};

  return (
    <div className="sm:p-4">
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
            ) : communityData && communityData.icon ? (
              <Avatar className={`size-14 md:size-20 lg:size-26`}>
                <AvatarImage
                  src={communityData.icon}
                  alt={`${communityData.name} icon`}
                />
              </Avatar>
            ) : (
              <Avatar
                className={`flex justify-center items-center size-14 md:size-20 lg:size-26 text-xl bg-black`}
              >
                <AvatarFallback>
                  {communityData && communityData.name ? (
                    communityData.name.substring(0, 3).toUpperCase()
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
                communityData?.name
              )}
            </h2>
          </div>
        </div>
        {!userPending && userData && (
          <div className="flex justify-end sm:items-end gap-4">
            <Button variant={"outline"}>
              <Plus />
              Create Post
            </Button>
            <Button>Join</Button>
          </div>
        )}
      </section>
      {/* {!posts ? (
        <div className="flex flex-col gap-4 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-6 w-4/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          {posts.map((post) => (
            <div key={post.id} className="flex flex-col gap-2">
              <h3 className="text-lg font-bold">{post.title}</h3>
              <p className="text-sm text-muted-foreground">{post.content}</p>
            </div>
          ))}
        </div>
      )} */}
      <main className="w-full">
        {isPending ? (
          <div className="flex flex-col justify-center items-center w-full gap-4 mt-4">
            <LoadingSpinner />
          </div>
        ) : postsData && postsData.length > 0 ? (
          <>
            <Separator />
            {postsData.map((post) => (
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
    </div>
  );
}
