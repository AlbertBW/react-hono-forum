import {
  Community,
  getCommunityQueryOptions,
  updateCommunityBanner,
  updateCommunityDescription,
  updateCommunityIcon,
  updateCommunityPrivacy,
} from "@/api/community.api";
import { uploadImage } from "@/api/image-upload.api";
import DeleteCommunity from "@/components/buttons/delete-community";
import FieldInfo from "@/components/field-info";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";
import { compressImage } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { descriptionSchema } from "../../../../../server/db/schema";
import RemoveMod from "@/components/buttons/remove-mod";
import AddMod from "@/components/buttons/add-mod";

export const Route = createFileRoute("/c/$name/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  const { name } = Route.useParams();
  const { data: userData, isPending: userPending } = useSession();
  const {
    isPending,
    error,
    data: community,
  } = useQuery(getCommunityQueryOptions(name));

  if (isPending || userPending) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if ((!isPending && !community) || error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <h1 className="text-3xl font-bold mb-4">Community Not Found</h1>
        <p className="text-lg text-muted-foreground mb-8">
          The community you're looking for doesn't exist.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link to={`/`}>Back Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isModerator = community.moderators.some(
    (mod) => mod.userId === userData?.user.id
  );

  if (!isModerator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-lg text-muted-foreground mb-8">
          You don't have permission to manage this community.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link to={`/`}>Back Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Community Settings</h1>

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="moderators">Moderators</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <NewIconImage community={community} />
                <NewBannerImage community={community} />
                <NewDescription community={community} />
                <PrivacySettings community={community} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderators">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Moderator Management</CardTitle>
              <AddMod communityId={community.id} />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {community.moderators.map((mod) => (
                  <div
                    key={mod.userId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={mod.avatar} alt={mod.username} />
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-medium">{mod.username}</h3>
                      </div>
                    </div>
                    <RemoveMod
                      modId={mod.userId}
                      communityId={community.id}
                      name={mod.username}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-red-800">
            <CardHeader>
              <CardTitle className="text-red-500">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                These actions are destructive and cannot be undone.
              </p>
              <DeleteCommunity id={community.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NewIconImage({ community }: { community: Community }) {
  const { data: session } = useSession();
  const [iconImagePreview, setIconImagePreview] = useState<string | null>(null);
  const [iconImage, setIconImage] = useState<File | null>(null);
  const iconFileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleIconImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error("Not authenticated");
      }

      if (!iconImage) {
        throw new Error("No icon image provided");
      }

      const image = await compressImage(iconImage, "avatar");
      const iconData = await uploadImage(image);

      const err = await updateCommunityIcon(community.id, iconData.url);
      if (err?.error) {
        throw new Error(err.error.message);
      }
      setIconImage(null);
      setIconImagePreview(null);
    },
    onSuccess: () => {
      toast.success("Icon updated successfully");

      queryClient.invalidateQueries({
        queryKey: ["get-community", community.name],
      });
      queryClient.invalidateQueries({
        queryKey: ["get-infinite-communities"],
      });
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An error occurred while updating the icon");
      }
    },
  });

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Community Icon</h3>
      <div className="flex items-center gap-4">
        <Avatar>
          {!iconImagePreview ? (
            <AvatarImage src={community.icon} alt={`${community.name} icon`} />
          ) : (
            <AvatarImage
              src={iconImagePreview}
              alt={`${community.name} icon`}
            />
          )}
        </Avatar>
        {/* Hidden file input */}
        <Input
          id="iconImage"
          type="file"
          ref={iconFileInputRef}
          accept="image/*"
          onChange={(e) => handleIconImageChange(e)}
          className="hidden"
        />

        {/* Custom file input button */}
        {!iconImagePreview ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => iconFileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <ImagePlus />
            Upload Icon
          </Button>
        ) : (
          <Button
            onClick={() => {
              setIconImagePreview(null);
              setIconImage(null);
              if (iconFileInputRef.current) {
                iconFileInputRef.current.value = "";
              }
            }}
            variant={"ghost"}
          >
            <X />
          </Button>
        )}

        {iconImage && (
          <Button
            onClick={() => {
              mutation.mutate();
            }}
            disabled={mutation.isPending}
          >
            Save Icon
          </Button>
        )}
      </div>
    </div>
  );
}

function NewBannerImage({ community }: { community: Community }) {
  const { data: session } = useSession();
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(
    null
  );
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error("Not authenticated");
      }

      if (!bannerImage) {
        throw new Error("No banner image provided");
      }

      const image = await compressImage(bannerImage, "banner");
      const iconData = await uploadImage(image);

      const err = await updateCommunityBanner(community.id, iconData.url);
      if (err?.error) {
        throw new Error(err.error.message);
      }
      setBannerImage(null);
      setBannerImagePreview(null);
    },
    onSuccess: () => {
      toast.success("Banner updated successfully");

      queryClient.invalidateQueries({
        queryKey: ["get-community", community.name],
      });
      queryClient.invalidateQueries({
        queryKey: ["get-infinite-communities"],
      });
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An error occurred while updating the icon");
      }
    },
  });

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Community Banner</h3>
      <div className="space-y-4">
        {!bannerImagePreview ? (
          <img
            src={community.banner}
            alt={`${community.name} banner`}
            className="w-full h-32 object-cover rounded-md border"
          />
        ) : (
          <img
            src={bannerImagePreview}
            alt={`banner preview`}
            className="w-full h-32 object-cover rounded-md border"
          />
        )}

        {/* Hidden file input */}
        <Input
          id="bannerImage"
          type="file"
          ref={bannerFileInputRef}
          accept="image/*"
          onChange={(e) => handleBannerImageChange(e)}
          className="hidden"
        />

        {/* Custom file input button */}
        {!bannerImagePreview ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => bannerFileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <ImagePlus />
            Upload Banner
          </Button>
        ) : (
          <Button
            onClick={() => {
              setBannerImagePreview(null);
              setBannerImage(null);
              if (bannerFileInputRef.current) {
                bannerFileInputRef.current.value = "";
              }
            }}
            variant={"ghost"}
          >
            <X />
          </Button>
        )}

        {bannerImage && (
          <Button
            onClick={() => {
              mutation.mutate();
            }}
            disabled={mutation.isPending}
          >
            Save Banner
          </Button>
        )}
      </div>
    </div>
  );
}

function NewDescription({ community }: { community: Community }) {
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm({
    validators: {
      onChange: z.object({
        description: descriptionSchema,
      }),
    },
    defaultValues: {
      description: community.description,
    },
    onSubmit: async ({ value }) => {
      try {
        if (value.description === community.description) {
          setEditing(false);
          throw new Error("No changes made");
        }

        const result = await updateCommunityDescription(
          community.id,
          value.description
        );
        if (result?.error) {
          throw new Error(result.error.message);
        }
        queryClient.invalidateQueries({
          queryKey: ["get-infinite-communities"],
        });
        queryClient.invalidateQueries({
          queryKey: ["get-community"],
        });
        setEditing(false);
        toast.success("Description updated successfully");
      } catch (error) {
        toast.error("Error", {
          description:
            error instanceof Error
              ? error.message
              : "Failed to create new comment",
        });
      }
    },
  });

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Community Description</h3>

      {!editing ? (
        <div className="space-y-4">
          <p>{community.description}</p>
          <Button onClick={() => setEditing(true)} variant={"outline"}>
            Edit
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="description"
            children={(field) => (
              <div>
                <Label htmlFor={field.name} hidden>
                  Description
                </Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  autoComplete="off"
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                  className={`${
                    field.state.meta.isTouched && field.state.meta.errors.length
                      ? "focus-visible:ring-2 focus-visible:ring-orange-500 ring-2 ring-red-700"
                      : field.state.meta.isTouched &&
                          field.state.value.length > 0
                        ? "focus-visible:ring-green-500 ring-2 ring-green-500"
                        : ""
                  }`}
                />
                <FieldInfo field={field} />
              </div>
            )}
          />

          <div className="space-x-4">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner /> Loading
                    </div>
                  ) : (
                    `Save Description`
                  )}
                </Button>
              )}
            />
            <Button
              type="button"
              onClick={() => {
                setEditing(false);
                form.reset();
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function PrivacySettings({ community }: { community: Community }) {
  const queryClient = useQueryClient();
  const [isPrivate, setIsPrivate] = useState(community.isPrivate);

  const mutation = useMutation({
    mutationFn: updateCommunityPrivacy,
    onSuccess: () => {
      setIsPrivate(!isPrivate);
      toast.success("Community privacy setting updated");
      queryClient.invalidateQueries({
        queryKey: ["get-community", community.name],
      });
      queryClient.invalidateQueries({
        queryKey: ["get-infinite-communities"],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    },
  });

  return (
    <div className="pt-6 border-t">
      <h3 className="text-lg font-medium mb-4">Community Privacy</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">
            {isPrivate ? "Private" : "Public"} Community
          </p>
          <p className="text-sm text-muted-foreground">
            {isPrivate
              ? "Only approved users can see and participate in this community"
              : "Anyone can view and participate in this community"}
          </p>
        </div>
        <Button
          variant={isPrivate ? "default" : "outline"}
          onClick={() =>
            mutation.mutate({ communityId: community.id, newValue: !isPrivate })
          }
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <LoadingSpinner />
          ) : isPrivate ? (
            "Make Public"
          ) : (
            "Make Private"
          )}
        </Button>
      </div>
    </div>
  );
}
