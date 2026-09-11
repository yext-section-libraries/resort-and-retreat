import type { ComplexImageType, ImageType } from "@yext/pages-components";
import type { TranslatableAssetImage } from "@yext/visual-editor";

type SectionImage =
  | ImageType
  | ComplexImageType
  | TranslatableAssetImage;

export const getImageUrl = (image: unknown): string | undefined => {
  if (!image || typeof image !== "object") {
    return undefined;
  }

  if ("url" in image && typeof image.url === "string" && image.url.trim()) {
    return image.url;
  }

  if (
    "image" in image &&
    image.image &&
    typeof image.image === "object" &&
    "url" in image.image &&
    typeof image.image.url === "string" &&
    image.image.url.trim()
  ) {
    return image.image.url;
  }

  return undefined;
};

export const hasImageSource = (image: unknown): image is SectionImage =>
  Boolean(getImageUrl(image));
