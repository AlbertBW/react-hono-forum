import {
  Community,
  getCommunityQueryOptions,
  updateCommunityBanner,
  updateCommunityIcon,
} from "@/api/community.api";
import { uploadImage } from "@/api/image-upload.api";
import DeleteCommunity from "@/components/buttons/delete-community";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/lib/auth-client";
import { compressImage } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

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

  if (
    error ||
    (!isPending && !community) ||
    userPending ||
    !userData ||
    !community
  ) {
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

  const isModerator = community.moderators.some(
    (mod) => mod.userId === userData.user.id
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
              {/* Add community edit form here */}
              <div className="space-y-6">
                <NewIconImage community={community} />
                <NewBannerImage community={community} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderators">
          <Card>
            <CardHeader>
              <CardTitle>Moderator Management</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add moderator management here */}
              <p>Moderator management coming soon</p>
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
      <h3 className="text-lg font-medium mb-2">Community Icon</h3>
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
          >
            Save Banner
          </Button>
        )}
      </div>
    </div>
  );
}
