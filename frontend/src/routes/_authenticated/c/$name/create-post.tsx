import FieldInfo from "@/components/field-info";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPost, getCommunityQueryOptions } from "@/lib/api";
import { Label } from "@radix-ui/react-label";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { randomGradient } from "@/lib/common-styles";
import { insertPostSchema } from "../../../../../../server/db/schema";

export const Route = createFileRoute("/_authenticated/c/$name/create-post")({
  component: RouteComponent,
});

function RouteComponent() {
  const { name } = Route.useParams();
  const communityQueryOption = getCommunityQueryOptions(name);
  const navigate = useNavigate();
  const { isPending, error, data: community } = useQuery(communityQueryOption);
  const queryClient = useQueryClient();

  const form = useForm({
    validators: {
      onChange: insertPostSchema,
    },
    defaultValues: {
      title: "",
      content: "",
      communityId: "",
    },
    onSubmit: async ({ value }) => {
      try {
        if (!community) {
          throw new Error("Community not found");
        }

        const newPost = await createPost({ value });
        if (community) {
          navigate({ to: `/c/${community.name}/${newPost.id}` });
        }

        // invalidate the query so the new post shows up
        queryClient.invalidateQueries(communityQueryOption);
        toast.success("Post created", {
          description: `Successfully created post: ${newPost.title}`,
        });
      } catch {
        toast.error("Error", { description: "Failed to create new post" });
      }
    },
  });

  if (error) {
    return <div>{error.message}</div>;
  }

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!community) {
    return <div>Community not found</div>;
  }

  return (
    <div className="flex flex-col justify-center items-start pt-4 gap-6 max-w-3xl m-auto">
      <h2 className="font-bold text-2xl text-muted-foreground">Create Post</h2>
      <div className="flex items-center gap-4 bg-accent/60 p-2 px-3 rounded-full">
        {community && community.icon ? (
          <Avatar className={`size-8`}>
            <AvatarImage src={community.icon} alt={`${community.name} icon`} />
          </Avatar>
        ) : (
          <Avatar
            className={`flex justify-center items-center size-8 text-xl bg-black`}
          >
            <AvatarFallback className={randomGradient()}></AvatarFallback>
          </Avatar>
        )}
        <h3 className="font-semibold pr-1">{community.name}</h3>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="w-full space-y-6"
      >
        <form.Field
          name="communityId"
          defaultValue={community.id}
          children={(field) => (
            <input
              type="hidden"
              name={field.name}
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        />

        <form.Field
          name="title"
          children={(field) => (
            <div>
              <Label htmlFor={field.name} hidden>
                Title
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                type="text"
                onBlur={field.handleBlur}
                placeholder="Title"
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
              <Label htmlFor={field.name} hidden>
                Content
              </Label>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                placeholder="Content"
                onChange={(e) => field.handleChange(e.target.value)}
                className={`h-32 resize-none ${
                  field.state.meta.isTouched && field.state.meta.errors.length
                    ? "focus-visible:ring-2 focus-visible:ring-orange-500 ring-2 ring-red-700 whitespace-pre-line"
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
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "..." : "Create Post"}
            </Button>
          )}
        />
      </form>
    </div>
  );
}
