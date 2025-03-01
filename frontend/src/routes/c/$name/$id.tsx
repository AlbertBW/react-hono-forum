import VoteButtons from "@/components/buttons/vote-buttons";
import Aside from "@/components/layout/aside";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getCommunityQueryOptions, getPostQueryOptions } from "@/lib/api";
import { randomGradient } from "@/lib/common-styles";
import { getPostTime } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/c/$name/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { name, id } = Route.useParams();
  const communityQueryOption = getCommunityQueryOptions(name);
  const { data: communityPageData } = useQuery(communityQueryOption);

  const getPost = getPostQueryOptions(id);
  const { isPending, error, data: post } = useQuery(getPost);

  const navigate = useNavigate();

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const { community } = communityPageData || {};

  if (!post || !community) {
    return <div>Post not found</div>;
  }

  return (
    <div className="flex p-4  max-w-7xl mx-auto">
      <main className="w-full">
        <div className="w-full gap-2 flex">
          <Button
            variant={"outline"}
            className="flex items-center gap-2 rounded-full size-10"
            onClick={() => navigate({ to: "/c/$name", params: { name } })}
          >
            <ArrowLeft />
          </Button>

          {community && community.icon ? (
            <Avatar className={`size-9`}>
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
                {getPostTime(post.createdAt)}
              </span>
            </div>
            <Link
              className="text-xs text-accent-foreground/70 hover:text-blue-200"
              to={"/c/$name"}
              params={{ name }}
            >
              {post.username}
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-1">
          <h2 className="text-3xl font-semibold">{post.title}</h2>
          <p>{post.content}</p>
        </div>

        <div className="flex items-center gap-2 pt-6">
          <VoteButtons post={post} />
          <div>
            <Button
              variant={"ghost"}
              className="text-muted-foreground hover:text-foreground rounded-full"
            >
              12 Comments
            </Button>
          </div>
        </div>
      </main>
      <Aside community={community} header button />
    </div>
  );
}
