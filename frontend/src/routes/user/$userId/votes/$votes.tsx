import {
  getThreadsByVotedInfiniteQueryOptions,
  VotedThreadCardType,
} from "@/api/thread.api";
import { getUserByIdQueryOptions } from "@/api/user.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/spinner";
import { THREADS_PER_PAGE } from "@/lib/constants";
import { getTimeAgo } from "@/lib/utils";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { Fragment } from "react";

export const Route = createFileRoute("/user/$userId/votes/$votes")({
  beforeLoad: async ({ params }) => {
    if (
      location.pathname !== `/user/${params.userId}/votes/upvotes` &&
      location.pathname !== `/user/${params.userId}/votes/downvotes`
    ) {
      throw redirect({
        to: `/user/$userId/overview`,
        params: { userId: params.userId },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const location = useLocation();
  const votes = location.pathname.includes("upvotes") ? 1 : -1;
  const { userId } = Route.useParams();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery(
      getThreadsByVotedInfiniteQueryOptions({
        userId,
        voted: votes,
        limit: THREADS_PER_PAGE,
      })
    );

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
        <div>
          {pages?.map((thread) => (
            <Fragment key={thread.threadId}>
              <UserVotedThread thread={thread} userId={userId} votes={votes} />
              <Separator />
            </Fragment>
          ))}
          {hasNextPage && (
            <div className="flex justify-center my-4">
              <Button
                disabled={!hasNextPage || isFetchingNextPage}
                onClick={() => fetchNextPage()}
                className="mb-4"
              >
                {isFetchingNextPage ? <LoadingSpinner /> : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UserVotedThread({
  userId,
  thread,
  votes,
}: {
  userId: string;
  thread: VotedThreadCardType;
  votes: number;
}) {
  const navigate = useNavigate();

  const { data: user } = useQuery(getUserByIdQueryOptions(userId));

  return (
    <article className="pb-0 sm:pb-1 pt-1 px-2 md:px-0 hover:cursor-pointer">
      <Link
        to={"/c/$name/$id"}
        params={{ name: thread.communityName, id: thread.threadId }}
        className="flex flex-col gap-2 p-2 hover:bg-muted/20 rounded-xl"
      >
        <div className="flex items-center gap-2 ">
          {thread.communityIcon ? (
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
                className={`flex justify-center items-center size-7 bg-black hover:cursor-pointer`}
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
              className={`flex justify-center items-center size-7 bg-black`}
            >
              <AvatarFallback>
                <Skeleton />
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-1">
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

              <span className="text-xs font-semibold text-muted-foreground">
                •
              </span>
              <span className="text-xs font-semibold text-muted-foreground">
                {getTimeAgo(thread.threadCreatedAt)}
              </span>
            </div>

            <div className="flex flex-row items-center gap-1">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  navigate({
                    to: `/user/$userId`,
                    params: { userId },
                  });
                }}
                className="text-xs font-semibold text-muted-foreground hover:underline hover:cursor-pointer"
              >
                {user?.name}
              </button>
              <span className="text-xs font-semibold text-muted-foreground">
                {votes === 1 ? "upvoted" : "downvoted"}{" "}
                {getTimeAgo(thread.votedAt)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <span className="text-sm sm:text-lg font-semibold">
            {thread.title}
          </span>
        </div>
      </Link>
    </article>
  );
}
