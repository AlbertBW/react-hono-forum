import SignInForm from "@/components/auth/sign-in-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in")({
  component: SignIn,
});

export default function SignIn() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="mb-12">
        <SignInForm />
      </div>
    </div>
  );
}
