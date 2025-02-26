import { signOut } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export default function SignOutForm() {
  const navigate = useNavigate();
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Sign Out</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Would you like to sign out?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row gap-4">
          <Button
            variant="outline"
            className={cn("w-full gap-2 cursor-pointer")}
            onClick={async () => {
              await signOut({
                fetchOptions: {
                  onSuccess: () => {
                    navigate({ to: "/" });
                  },
                },
              });
            }}
          >
            Sign Out
          </Button>
          <Link to="/">
            <Button className={cn("w-full gap-2 cursor-pointer")}>
              Go back
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
