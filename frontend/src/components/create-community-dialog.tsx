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
import { compressImage, getRandomIcon } from "@/lib/utils";
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
  Image,
  imageSchema,
  insertCommunitySchema,
} from "../../../server/db/schema";
import { createCommunity } from "@/api/community.api";
import { useQueryClient } from "@tanstack/react-query";
import { uploadImage } from "@/api/image-upload.api";

export default function CreateCommunityDialog() {
  const { data: session, isPending: sessionPending } = useSession();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();
  const queryClient = useQueryClient();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const form = useForm({
    validators: {
      onMount: insertCommunitySchema
        .omit({ icon: true })
        .extend({ image: imageSchema }),
      onChange: insertCommunitySchema
        .omit({ icon: true })
        .extend({ image: imageSchema }),
    },
    defaultValues: {
      name: "",
      description: "",
      isPrivate: false,
      image: null as Image,
    },
    onSubmit: async ({ value }) => {
      try {
        if (value.image && !value.image.type.startsWith("image")) {
          throw new Error("Please ensure the file is an image");
        }

        let iconData: { url: string } = { url: getRandomIcon() };
        if (value.image) {
          const image = await compressImage(value.image, "avatar");

          iconData = await uploadImage(image);
        }

        const { data, error } = await createCommunity({
          value: { ...value, icon: iconData.url },
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
                  setName(e.target.value);
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
          name="image"
          children={(field) => (
            <div className="py-2">
              <Label htmlFor={field.name}>Community Icon (optional)</Label>
              <div className="flex flex-col  mt-2">
                <div className="flex items-center gap-2 w-full">
                  {imagePreview ? (
                    <Avatar className="size-12">
                      <AvatarImage src={imagePreview} alt="Community icon" />
                    </Avatar>
                  ) : (
                    <Avatar className="bg-zinc-800 flex justify-center items-center size-12">
                      <AvatarFallback>
                        {name ? name.substring(0, 3).toUpperCase() : ""}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {/* Hidden file input */}
                  <Input
                    id="image"
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      handleImageChange(e);
                      field.handleChange(e.target.files?.[0] || null);
                    }}
                    className="hidden"
                  />

                  {/* Custom file input button */}
                  {!imagePreview ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <ImagePlus />
                      Upload Icon
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setImagePreview(null);
                        field.handleChange(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
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
          <DialogTrigger>
            <Button variant={"outline"}>Cancel</Button>
          </DialogTrigger>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <DialogTrigger disabled={!canSubmit}>
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
              </DialogTrigger>
            )}
          />
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
