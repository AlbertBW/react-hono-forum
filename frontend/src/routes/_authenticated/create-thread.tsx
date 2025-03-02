import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import FieldInfo from "@/components/field-info";
import { insertThreadSchema } from "../../../../server/db/schema";
import { getAllThreadsQueryOptions, createThread } from "@/api/thread.api";
import { loadingCreateThreadQueryOptions } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/create-thread")({
  component: CreateThread,
});

function CreateThread() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const form = useForm({
    validators: {
      onChange: insertThreadSchema,
    },
    defaultValues: {
      title: "",
      content: "",
    },
    onSubmit: async ({ value }) => {
      const existingThreads = await queryClient.ensureQueryData(
        getAllThreadsQueryOptions
      );

      navigate({ to: "/threads" });

      // loading state
      queryClient.setQueryData(loadingCreateThreadsQueryOptions.queryKey, {
        thread: value,
      });

      try {
        const newThread = await createThread({ value });

        queryClient.setQueryData(getAllThreadsQueryOptions.queryKey, {
          ...existingThreads,
          threads: [newThread, ...existingThreads.threads],
        });
        // sucess state
        toast.success("thread created", {
          description: `Successfully created thread: ${newThread.title}`,
        });
      } catch {
        // error state
        toast.error("Error", { description: "Failed to create new thread" });
      } finally {
        queryClient.setQueryData(loadingCreateThreadQueryOptions.queryKey, {});
      }
    },
  });
  return (
    <div className="flex flex-col justify-center items-center">
      <h2>Create thread</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="w-full max-w-3xl m-auto space-y-2"
      >
        <form.Field
          name="title"
          children={(field) => (
            <div>
              <Label htmlFor={field.name}>Title</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                type="text"
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className={`${
                  field.state.meta.isTouched && field.state.meta.errors.length
                    ? "focus-visible:ring-2 focus-visible:ring-orange-500 ring-2 ring-red-700"
                    : field.state.meta.isTouched && field.state.value.length > 0
                      ? "focus-visible:ring-green-500 ring-2 ring-green-500"
                      : ""
                }`}
              />
              <FieldInfo field={field} />
            </div>
          )}
        />
        <form.Field
          name="content"
          children={(field) => (
            <div>
              <Label htmlFor={field.name}>Content</Label>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className={`h-32 resize-none ${
                  field.state.meta.isTouched && field.state.meta.errors.length
                    ? "focus-visible:ring-2 focus-visible:ring-orange-500 ring-2 ring-red-700"
                    : field.state.meta.isTouched && field.state.value.length > 0
                      ? "focus-visible:ring-green-500 ring-2 ring-green-500"
                      : ""
                }`}
              />
              <FieldInfo field={field} />
            </div>
          )}
        />
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? "..." : "Create thread"}
            </Button>
          )}
        />
      </form>
    </div>
  );
}
