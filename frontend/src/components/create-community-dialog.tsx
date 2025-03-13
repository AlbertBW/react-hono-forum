import { Button } from "./ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useForm } from "@tanstack/react-form";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import FieldInfo from "./field-info";
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { compressImage, getRandomBanner, getRandomIcon } from "@/lib/utils";
import { Avatar, AvatarImage } from "./ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { LoadingSpinner } from "./ui/spinner";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Card } from "./ui/card";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import SignInForm from "./auth/sign-in-form";
import { useSession } from "@/lib/auth-client";
import { useSidebar } from "./ui/sidebar";
import {
  CreateImage,
  imageSchema,
  insertCommunitySchema,
} from "../../../server/db/schema";
import { createCommunity } from "@/api/community.api";
import { useQueryClient } from "@tanstack/react-query";
import { uploadImage } from "@/api/image-upload.api";

export default function CreateCommunityDialog() {
  const { data: session, isPending: sessionPending } = useSession();
  const [iconImagePreview, setIconImagePreview] = useState<string | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(
    null
  );
  const iconFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const queryClient = useQueryClient();

  const handleIconImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetForm = () => {
    setIconImagePreview(null);
    setBannerImagePreview(null);
    form.reset();
  };
  const form = useForm({
    validators: {
      onMount: insertCommunitySchema
        .omit({ icon: true, banner: true })
        .extend({ iconImage: imageSchema, bannerImage: imageSchema }),
      onChange: insertCommunitySchema
        .omit({ icon: true, banner: true })
        .extend({ iconImage: imageSchema, bannerImage: imageSchema }),
    },
    defaultValues: {
      name: "",
      description: "",
      isPrivate: false,
      iconImage: null as CreateImage,
      bannerImage: null as CreateImage,
    },
    onSubmit: async ({ value }) => {
      try {
        if (value.iconImage && !value.iconImage.type.startsWith("image")) {
          throw new Error("Please ensure the file is an image");
        }
        if (value.bannerImage && !value.bannerImage.type.startsWith("image")) {
          throw new Error("Please ensure the file is an image");
        }

        let iconData: { url: string } = { url: getRandomIcon() };
        let bannerData: { url: string } = { url: getRandomBanner() };
        if (value.iconImage) {
          const image = await compressImage(value.iconImage, "avatar");

          iconData = await uploadImage(image);
        }
        if (value.bannerImage) {
          const image = await compressImage(value.bannerImage, "banner");

          bannerData = await uploadImage(image);
        }

        const { data, error } = await createCommunity({
          value: { ...value, icon: iconData.url, banner: bannerData.url },
        });

        if (error) {
          throw new Error(error.message);
        }
        toast.success("Community created", {
          description: `Successfully created community: ${data.name}`,
        });
        queryClient.invalidateQueries({
          queryKey: ["get-infinite-communities"],
        });
        queryClient.invalidateQueries({
          queryKey: ["get-community"],
        });
        triggerRef.current?.click();
        navigate({ to: `/c/${data.name}` });
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

  if (sessionPending) return null;

  if (!session)
    return (
      <DialogContent>
        <SignInForm borderHidden />
      </DialogContent>
    );

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create a community</DialogTitle>
        <DialogDescription>
          Add a name and description to create a new community.
        </DialogDescription>
      </DialogHeader>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="name"
          children={(field) => (
            <div>
              <Label htmlFor={field.name}>Community Name</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                type="text"
                onBlur={field.handleBlur}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                }}
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
          name="description"
          children={(field) => (
            <div>
              <Label htmlFor={field.name}>Description</Label>
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
        <form.Field
          name="iconImage"
          children={(field) => (
            <div className="pt-2">
              <Label htmlFor={field.name}>Community Icon (optional)</Label>
              <div className="flex flex-col  mt-2">
                <div className="flex items-center gap-2 w-full">
                  {iconImagePreview ? (
                    <Avatar className="size-12">
                      <AvatarImage
                        src={iconImagePreview}
                        alt="Community icon"
                      />
                    </Avatar>
                  ) : (
                    <Avatar className="bg-accent shadow flex justify-center items-center size-12">
                      <AvatarFallback>
                        <ImagePlus />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {/* Hidden file input */}
                  <Input
                    id="iconImage"
                    type="file"
                    ref={iconFileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      handleIconImageChange(e);
                      field.handleChange(e.target.files?.[0] || null);
                    }}
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
                        field.handleChange(null);
                        if (iconFileInputRef.current) {
                          iconFileInputRef.current.value = "";
                        }
                      }}
                      variant={"ghost"}
                    >
                      <X />
                    </Button>
                  )}
                </div>
                <FieldInfo field={field} />
              </div>
            </div>
          )}
        />

        <form.Field
          name="bannerImage"
          children={(field) => (
            <div className="py-2">
              <Label htmlFor={field.name}>Community Banner (optional)</Label>
              <div className="flex flex-col  mt-2">
                <div className="flex items-center gap-2 w-full">
                  {bannerImagePreview ? (
                    <img
                      src={bannerImagePreview}
                      alt="Community banner"
                      className="aspect-5/1 rounded-lg object-cover max-w-80"
                    />
                  ) : (
                    <div className="bg-accent shadow size-12 rounded-lg flex justify-center items-center">
                      <ImagePlus />
                    </div>
                  )}
                  {/* Hidden file input */}
                  <Input
                    id="bannerImage"
                    type="file"
                    ref={bannerFileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      handleBannerImageChange(e);
                      field.handleChange(e.target.files?.[0] || null);
                    }}
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
                        field.handleChange(null);
                        if (bannerFileInputRef.current) {
                          bannerFileInputRef.current.value = "";
                        }
                      }}
                      variant={"ghost"}
                    >
                      <X />
                    </Button>
                  )}
                </div>
                <FieldInfo field={field} />
              </div>
            </div>
          )}
        />

        <form.Field
          name="isPrivate"
          children={(field) => (
            <div className="py-2">
              <Label className="text-base font-medium">Privacy Setting</Label>
              <RadioGroup
                defaultValue={field.state.value ? "true" : "false"}
                onValueChange={(value) => field.handleChange(value === "true")}
                className="mt-2"
              >
                <Card
                  className={`border transition-all py-2 ${!field.state.value ? "border-primary" : ""}`}
                >
                  <label
                    htmlFor="public"
                    className="flex items-center gap-3 p-0 px-4 cursor-pointer"
                  >
                    <RadioGroupItem value="false" id="public" />
                    <div>
                      <p className="font-medium">Public</p>
                      <p className="text-sm text-muted-foreground">
                        Anyone can view, post, and comment to this community
                      </p>
                    </div>
                  </label>
                </Card>

                <Card
                  className={`border transition-all py-2 ${field.state.value ? "border-primary" : ""}`}
                >
                  <label
                    htmlFor="private"
                    className="flex items-center gap-3 p-0 px-4 cursor-pointer"
                  >
                    <RadioGroupItem value="true" id="private" />
                    <div>
                      <p className="font-medium">Private</p>
                      <p className="text-sm text-muted-foreground">
                        Only approved users can view and contribute
                      </p>
                    </div>
                  </label>
                </Card>
              </RadioGroup>

              <FieldInfo field={field} />
            </div>
          )}
        />
        <DialogFooter>
          <DialogTrigger ref={triggerRef} asChild>
            <Button onClick={handleResetForm} variant={"outline"}>
              Cancel
            </Button>
          </DialogTrigger>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit}
                onClick={() => setOpenMobile(false)}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner /> Loading
                  </div>
                ) : (
                  `Create Community`
                )}
              </Button>
            )}
          />
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
