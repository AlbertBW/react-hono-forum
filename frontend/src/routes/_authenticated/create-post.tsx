import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "@tanstack/react-form";
import {
  createPost,
  getAllPostsQueryOptions,
  loadingCreatePostQueryOptions,
} from "@/lib/api";
import { insertPostSchema } from "../../../../server/shared-types";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import FieldInfo from "@/components/field-info";

export const Route = createFileRoute("/_authenticated/create-post")({
  component: CreatePost,
});

function CreatePost() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const form = useForm({
    validators: {
      onChange: insertPostSchema,
    },
    defaultValues: {
      title: "",
      content: "",
    },
    onSubmit: async ({ value }) => {
      const existingPosts = await queryClient.ensureQueryData(
        getAllPostsQueryOptions
      );

      navigate({ to: "/posts" });

      // loading state
      queryClient.setQueryData(loadingCreatePostQueryOptions.queryKey, {
        post: value,
      });

      try {
        const newPost = await createPost({ value });

        queryClient.setQueryData(getAllPostsQueryOptions.queryKey, {
          ...existingPosts,
          posts: [newPost, ...existingPosts.posts],
        });
        // sucess state
        toast.success("Post created", {
          description: `Successfully created post: ${newPost.title}`,
        });
      } catch {
        // error state
        toast.error("Error", { description: "Failed to create new post" });
      } finally {
        queryClient.setQueryData(loadingCreatePostQueryOptions.queryKey, {});
      }
    },
  });
  return (
    <div className="flex flex-col justify-center items-center">
      <h2>Create Post</h2>
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
              {isSubmitting ? "..." : "Create Post"}
            </Button>
          )}
        />
      </form>
    </div>
  );
}
