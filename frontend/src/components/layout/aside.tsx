import { Cake, Globe, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Lock } from "lucide-react";
import { JoinButton, LeaveCommunity } from "../buttons/join-leave-community";
import { useSession } from "@/lib/auth-client";
import { Community } from "@/api/community.api";
import { Separator } from "../ui/separator";
import { Avatar } from "../ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { Link } from "@tanstack/react-router";

export default function Aside({
  community,
  header = false,
  button = false,
}: {
  community: Community;
  header?: boolean;
  button?: boolean;
}) {
  const { data } = useSession();

  return (
    <aside className="sticky top-18 self-start lg:w-md h-fit ml-2 hidden lg:block">
      <Card className="py-3">
        <CardHeader className="px-4">
          <CardTitle>
            {header && (
              <div className="flex items-center gap-2 w-full justify-between">
                <span className="text-xl">{community.name}</span>
                {button &&
                  data &&
                  (community.isFollowing ? (
                    <LeaveCommunity id={community.id} name={community.name} />
                  ) : (
                    <JoinButton
                      id={community.id}
                      name={community.name}
                      className="bg-blue-600 hover:bg-blue-500 dark:text-accent-foreground w-18"
                    />
                  ))}
              </div>
            )}
            <span className="text-sm text-accent-foreground/80">
              c/{community.name}
            </span>
          </CardTitle>
          <CardDescription>{community.description}</CardDescription>
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
            <div className="flex flex-col pt-4 w-fit">
              <span>{community.userCount}</span>
              <span className="text-sm text-muted-foreground">
                Member{community.userCount > 1 && "s"}
              </span>
            </div>
            <div className="flex flex-col pt-4">
              <span>{community.threadCount}</span>
              <span className="text-sm text-muted-foreground">
                Thread{community.userCount > 1 && "s"}
              </span>
            </div>
          </div>
          {community.moderators.length > 0 && (
            <>
              <Separator className="mt-4 mb-2" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Moderators
                </span>{" "}
                <Shield size={16} className="text-muted-foreground" />
              </div>
              {community.moderators.map((mod) => (
                <div key={mod.userId} className="flex items-center gap-2 mt-2">
                  <Avatar className="size-8">
                    <AvatarImage src={mod.avatar} />
                  </Avatar>
                  <Link
                    to={`/user/$userId`}
                    params={{ userId: mod.userId }}
                    className="text-accent-foreground/70 text-sm hover:underline"
                  >
                    {mod.username}
                  </Link>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
