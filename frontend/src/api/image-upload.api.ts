export async function uploadImage(image: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("image", image);

  const res = await fetch(`/api/image`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload image");
  }

  return res.json();
}
