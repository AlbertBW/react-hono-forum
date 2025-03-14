import {
  getUserByIdQueryOptions,
  getUserOverviewQueryOptions,
} from "@/api/user.api";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/spinner";
import { getTimeAgo } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/user/$userId/overview")({
  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = Route.useParams();
  const {
    data: user,
    isPending,
    error,
  } = useQuery(getUserByIdQueryOptions(userId));

  const {
    data: userOverview,
    isPending: isOverviewPending,
    error: overviewError,
  } = useQuery(getUserOverviewQueryOptions(userId));

  if (isOverviewPending || isPending) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner />
      </div>
    );
  }

  if (overviewError || error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-200 text-red-600 rounded-md">
        <h2>User not found</h2>
        <p>Error: {error?.message}</p>
      </div>
    );
  }

  const { user: userInfo, stats } = userOverview;

  const recentActivity = [
    ...userInfo.comments.map((comment) => ({
      component: (
        <li
          key={comment.id}
          className="hover:bg-primary/10 group transition-colors"
        >
          <Link
            to={`/c/$name/$id`}
            params={{
              name: comment.thread!.community!.name!,
              id: comment.thread!.id,
            }}
            className="p-4 transition-colors flex items-center group"
          >
            <span className="font-medium mr-1">Commented on</span>
            <span className="mr-1">"{comment.thread?.title}"</span>
            <span className="text-sm text-primary/45 ml-1">
              {getTimeAgo(comment.createdAt)}
            </span>
          </Link>
        </li>
      ),
      date: new Date(comment.createdAt),
    })),
    ...userInfo.threads.map((thread) => ({
      component: (
        <li
          key={thread.id}
          className="hover:bg-primary/10 group transition-colors"
        >
          <Link
            to={`/c/$name/$id`}
            params={{
              name: thread.community.name,
              id: thread.id,
            }}
            className="p-4 transition-colors flex items-center group"
          >
            <span className="font-medium mr-1">Posted</span>
            <span className="mr-1">"{thread.title}"</span>
            <span className="text-sm text-primary/45 ml-1">
              {getTimeAgo(thread.createdAt)}
            </span>
          </Link>
        </li>
      ),
      date: new Date(thread.createdAt),
    })),
  ].sort((a, b) => {
    return b.date.getTime() - a.date.getTime();
  });

  return (
    <div className="max-w-2xl mx-auto p-4">
      {(isPending || isOverviewPending) && (
        <div className="text-center py-8">Loading user profile...</div>
      )}
      {user && stats ? (
        <>
          <section className="mb-8 bg-gradient-to-r from-primary/5 to-secondary/50 p-5 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-primary/80 border-b border-primary/20 pb-2">
              User Stats
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-primary/20 shadow-sm  to-secondary/50 text-primary/75">
                <h3 className="text-sm font-medium  text-primary/45">Posts</h3>
                <div className="text-2xl font-bold">{stats.postCount}</div>
              </div>

              <div className="p-4 rounded-lg border border-primary/20 shadow-sm to-secondary/50 text-primary/75">
                <h3 className="text-sm font-medium text-primary/45">
                  Comments
                </h3>
                <div className="text-2xl font-bold">{stats.commentCount}</div>
              </div>

              <div className="p-4 rounded-lg border border-primary/20 shadow-sm to-secondary/50 text-primary/75">
                <h3 className="text-sm font-medium text-primary/45">XP</h3>
                <div className="text-2xl font-bold">{stats.XP}</div>
              </div>
            </div>
          </section>
          {userInfo.moderator.length > 0 ? (
            <section className="mb-8 bg-gradient-to-r from-primary/5 to-secondary/50 p-5 rounded-xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-primary/80 border-b border-primary/20 pb-2">
                Communities Moderated
              </h2>
              <div className="rounded-lg border border-primary/20 shadow-sm overflow-hidden to-secondary/50">
                <ul className="divide-y divide-primary/20">
                  {userInfo.moderator.map((mod) => (
                    <li
                      key={mod.communityId}
                      className="hover:bg-primary/10 group transition-colors"
                    >
                      <Link
                        to={`/c/$name`}
                        params={{ name: mod.community.name }}
                        className="p-4 transition-colors flex items-center gap-4 group"
                      >
                        <Avatar className="size-10 shadow-sm group-hover:ring-2 ring-primary/70 group-hover:scale-110 transition-all">
                          <AvatarImage
                            src={mod.community.icon}
                            alt={mod.community.name}
                          />
                        </Avatar>
                        <span className="font-medium text-primary/75 group-hover:text-primary">
                          c/{mod.community.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          <section className="mb-8 bg-gradient-to-r from-primary/5 to-secondary/50 p-5 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-primary/80 border-b border-primary/20 pb-2">
              Recent Activity
            </h2>
            <div className="rounded-lg border border-primary/20 shadow-sm overflow-hidden to-secondary/50">
              <ul className="divide-y divide-primary/20">
                {recentActivity.map((activity) => activity.component)}
              </ul>
            </div>
          </section>
        </>
      ) : (
        <div>
          <h2>No data available for user {user?.name}</h2>
        </div>
      )}
    </div>
  );
}
