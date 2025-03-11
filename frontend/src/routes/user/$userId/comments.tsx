import {
  getUserCommentsInfiniteQueryOptions,
  UserComment,
} from "@/api/comment.api";
import { getUserByIdQueryOptions, User } from "@/api/user.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/spinner";
import { getTimeAgo } from "@/lib/utils";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";

export const Route = createFileRoute("/user/$userId/comments")({
  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = Route.useParams();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery(getUserCommentsInfiniteQueryOptions(userId, 20));

  const {
    data: user,
    isPending,
    error,
  } = useQuery(getUserByIdQueryOptions(userId));

  if ((!isPending && !user) || error) {
    return <div>User not found</div>;
  }

  const pages = data?.pages.flatMap((page) => page);

  return (
    <div>
      {status === "pending" ? (
        <div className="flex justify-center items-center h-20">
          <LoadingSpinner />
        </div>
      ) : status === "error" ? (
        <div>Error fetching posts</div>
      ) : (
        status === "success" &&
        user && (
          <div className="flex flex-col">
            {pages?.map((comment) => (
              <React.Fragment key={comment.id}>
                <ProfileCommentCard comment={comment} user={user} />
                <Separator />
              </React.Fragment>
            ))}
            {hasNextPage && (
              <div className="flex justify-center mt-4">
                <Button
                  disabled={!hasNextPage || isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  {isFetchingNextPage ? <LoadingSpinner /> : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

function ProfileCommentCard({
  comment,
  user,
}: {
  comment: UserComment;
  user: User;
}) {
  if (!comment.thread) {
    return null;
  }

  return (
    <article className="py-1">
      <Link
        to={"/c/$name/$id"}
        params={{ name: comment.thread.community.name, id: comment.thread.id }}
        className="flex flex-col gap-2 p-2 hover:bg-muted/20 rounded-xl"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Avatar
              className={`flex justify-center items-center size-5 bg-black`}
            >
              <AvatarImage
                src={comment.thread.community.icon}
                alt={`${comment.thread.community.name} Icon`}
              />

              <AvatarFallback></AvatarFallback>
            </Avatar>

            <div className="flex flex-row items-center gap-1">
              <Link
                to={"/c/$name"}
                params={{ name: comment.thread.community.name }}
                className="text-xs font-semibold text-foreground hover:underline hover:text-blue-200/90"
              >
                c/{comment.thread.community.name}
              </Link>

              <span className="text-xs font-semibold text-muted-foreground">
                •
              </span>
              <span className="text-xs font-semibold text-muted-foreground hover:underline hover:text-blue-200/90">
                {comment.thread.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-5" />

            <div className="flex flex-row items-center gap-1">
              <Link
                to={"/user/$userId"}
                params={{ userId: user.id }}
                className="text-xs font-semibold text-foreground/90 hover:underline hover:text-blue-200/90"
              >
                {user.name}
              </Link>

              <span className="text-xs font-semibold text-muted-foreground">
                commented
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {getTimeAgo(comment.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="w-5" />
          <span className="text-sm font-semibold text-foreground/80">
            {comment.content}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5" />

          <Link
            to={`/c/$name/$id`}
            params={{
              name: comment.thread.community.name,
              id: comment.thread.id,
            }}
            className="text-muted-foreground hover:text-foreground text-xs rounded-full"
          >
            View Thread
          </Link>
        </div>
      </Link>
    </article>
  );
}
