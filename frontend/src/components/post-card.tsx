import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { getPostTime } from "@/lib/utils";
import { Button } from "./ui/button";
import { type PostCard } from "@/lib/api";
import VoteButtons from "./buttons/vote-buttons";

export default function PostCard({ post }: { post: PostCard }) {
  if (!post.communityName) {
    throw new Error("Community name is required");
  }

  return (
    <article className="py-1">
      <Link
        to={"/c/$name/$id"}
        params={{ name: post.communityName, id: post.id }}
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
              {post.username || "Anonymous"}
            </Link>
            <span className="text-xs font-semibold text-muted-foreground">
              •
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {getPostTime(post.createdAt)}
            </span>
          </div>
        </div>

        <div>
          <Link to={"/"} className="text-base sm:text-lg font-semibold">
            {post.title}
          </Link>
        </div>

        <div className="flex items-center gap-2">
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
      </Link>
    </article>
  );
}
