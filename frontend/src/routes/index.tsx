import { randomGradient } from "@/lib/common-styles";
import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const bg = randomGradient();
  return (
    <div
      className={`${bg} h-[180px] w-[180px] flex justify-center items-center mt-4 ml-4`}
    >
      <Bot size={130} className="text-white" />
    </div>
  );
}
