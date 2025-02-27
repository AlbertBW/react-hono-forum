import { DialogTrigger } from "@radix-ui/react-dialog";
import { Button } from "./ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useForm } from "@tanstack/react-form";
import { insertCommunitySchema } from "../../../server/shared-types";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import FieldInfo from "./field-info";
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { convertImageToBase64, resizeBase64Image } from "@/lib/utils";
import { Avatar, AvatarImage } from "./ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { LoadingSpinner } from "./ui/spinner";

export default function CreateCommunityDialog() {
  return (
    <DialogContent>
      <CreateDialogForm />
    </DialogContent>
  );
}

function CreateDialogForm() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await convertImageToBase64(file);
      const resized = await resizeBase64Image(base64);
      setImagePreview(resized);
      return resized;
    }
  };

  const form = useForm({
    validators: {
      onMount: insertCommunitySchema,
      onChange: insertCommunitySchema,
    },
    defaultValues: {
      name: "",
      description: "",
      icon: "",
    },
    onSubmit: async ({ value }) => {
      console.log(value);
    },
  });
  return (
    <>
      <DialogHeader>
        <DialogTitle>Create a community</DialogTitle>
        <DialogDescription>
          A name and description for your community.
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
          name="icon"
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
                    onChange={async (e) => {
                      const base64 = await handleImageChange(e);
                      if (base64) field.handleChange(base64);
                      else {
                        e.target.value = "";
                        field.handleChange("");
                      }
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
                        field.handleChange("");
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
        <DialogFooter>
          <DialogTrigger>
            <Button variant={"outline"}>Cancel</Button>
          </DialogTrigger>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit}>
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
    </>
  );
}
