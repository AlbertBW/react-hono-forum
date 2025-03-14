import { Link, useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { useSession } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function HeaderProfile() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  if (isPending) return null;

  if (!session)
    return (
      <Link to="/sign-in" className="[&.active]:font-bold min-w-20 text-center">
        Sign In
      </Link>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="hover:cursor-pointer">
        <Avatar className="size-9 border-2 border-transparent bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500">
          {session?.user.image && (
            <AvatarImage src={session.user.image} alt="@shadcn" />
          )}
          <AvatarFallback className={`${isPending ? "" : "bg-transparent"}`}>
            {isPending ? <Skeleton className="h-12 w-12" /> : null}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            navigate({
              to: "/user/$userId",
              params: { userId: session.user.id },
            })
          }
        >
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => navigate({ to: "/sign-out" })}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
