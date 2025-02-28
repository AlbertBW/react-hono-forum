import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { getPostTime } from "@/lib/utils";
import { Button } from "./ui/button";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { type PostCard } from "@/lib/api";

export default function PostCard({ post }: { post: PostCard }) {
  return (
    <article className="py-1">
      <Link
        to="/"
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
          <div
            className="flex items-center gap-1 bg-zinc-900 size-fit rounded-full hover:cursor-default"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Button
              variant={"ghost"}
              className="rounded-full hover:text-green-500"
            >
              <ThumbsUp />
            </Button>

            <span>1</span>

            <Button
              variant={"ghost"}
              className="rounded-full hover:text-red-500"
            >
              <ThumbsDown />
            </Button>
          </div>

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
