import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { useSession } from "@/lib/auth-client";

export default function HeaderProfile() {
  const { data: session, isPending } = useSession();

  return (
    <>
      <>
        {isPending ? (
          <Skeleton className="w-20 h-6" />
        ) : session ? (
          <Link
            to="/sign-out"
            className="[&.active]:font-bold min-w-20 text-center"
          >
            Sign Out
          </Link>
        ) : (
          <Link
            to="/sign-in"
            className="[&.active]:font-bold min-w-20 text-center"
          >
            Sign In
          </Link>
        )}

        <Link to="/profile" className="[&.active]:font-bold">
          <Avatar className="size-9">
            {session?.user.image && (
              <AvatarImage src={session.user.image} alt="@shadcn" />
            )}
            <AvatarFallback className={`${isPending ? "" : "bg-transparent"}`}>
              {isPending ? <Skeleton className="h-12 w-12" /> : null}
            </AvatarFallback>
          </Avatar>
        </Link>
      </>
    </>
  );
}
