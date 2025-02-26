import SignOutForm from "@/components/auth/sign-out-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/sign-out")({
  component: SignOut,
});

function SignOut() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="mb-12">
        <SignOutForm />
      </div>
    </div>
  );
}
