import { Cake, Globe } from "lucide-react";
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
    <aside className="sticky top-18 self-start lg:w-md h-fit ml-2 hidden md:block">
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
                      className="bg-blue-600 hover:bg-blue-500 text-accent-foreground w-18"
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
        </CardContent>
      </Card>
    </aside>
  );
}
