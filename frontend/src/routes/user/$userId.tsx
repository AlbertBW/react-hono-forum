import { getUserByIdQueryOptions } from "@/api/user.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
// import { useSession } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";

export const Route = createFileRoute("/user/$userId")({
  component: UserPage,
  beforeLoad: ({ params }) => {
    if (location.pathname === `/user/${params.userId}`) {
      throw redirect({
        to: `/user/$userId/posts`,
        params: { userId: params.userId },
      });
    }
  },
});

function UserPage() {
  const { userId } = Route.useParams();
  // const { data: session } = useSession();
  const {
    data: user,
    isPending,
    error,
  } = useQuery(getUserByIdQueryOptions(userId));

  if ((!isPending && !user) || error) {
    return <div>User not found</div>;
  }

  return (
    <div className="mx-auto">
      <div className="p-4 flex">
        <Avatar className="size-20 border-2 border-foreground">
          {isPending ? (
            <AvatarFallback></AvatarFallback>
          ) : (
            user.image && (
              <AvatarImage
                src={user.image}
                alt={`${user.name}'s profile pic`}
              />
            )
          )}
        </Avatar>
        <div className="flex flex-col justify-center gap-1 ml-4">
          <h1 className="text-2xl font-bold">
            {isPending ? <Skeleton className="w-40 h-8" /> : user.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPending ? (
              <Skeleton className="w-42 h-5" />
            ) : (
              `Joined: ${new Date(user.createdAt).toDateString()}`
            )}
          </p>
        </div>
      </div>

      <div className="px-4">
        <div className="mb-2 flex flex-row gap-1 h-10">
          <Link
            className={`data-[status=active]:bg-zinc-800 flex justify-center items-center rounded-full data-[status=active]:text-foreground text-foreground/80 p-3 md:p-5 hover:underline hover:text-foreground transition text-sm md:text-base`}
            to={"/user/$userId/posts"}
            params={{ userId }}
          >
            Posts
          </Link>
          <Link
            className={`data-[status=active]:bg-zinc-800 flex justify-center items-center rounded-full data-[status=active]:text-foreground text-foreground/80 p-3 md:p-5 hover:underline hover:text-foreground transition text-sm md:text-base`}
            to={"/user/$userId/comments"}
            params={{ userId }}
          >
            Comments
          </Link>
          <Link
            className={`data-[status=active]:bg-zinc-800 flex justify-center items-center rounded-full data-[status=active]:text-foreground text-foreground/80 p-3 md:p-5 hover:underline hover:text-foreground transition text-sm md:text-base`}
            to={"/user/$userId/upvoted"}
            params={{ userId }}
          >
            Upvoted
          </Link>
          <Link
            className={`data-[status=active]:bg-zinc-800 flex justify-center items-center rounded-full data-[status=active]:text-foreground text-foreground/80 p-3 md:p-5 hover:underline hover:text-foreground transition text-sm md:text-base`}
            to={"/user/$userId/downvoted"}
            params={{ userId }}
          >
            Downvoted
          </Link>
        </div>
      </div>
      <Separator />

      <main className="px-4">
        <Outlet />
      </main>
    </div>
  );
}
