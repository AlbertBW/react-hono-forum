import AllThreads from "@/components/all-threads";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/c/all")({
  component: AllThreadsPage,
});

function AllThreadsPage() {
  return (
    <div className="px-2">
      <AllThreads />
    </div>
  );
}
