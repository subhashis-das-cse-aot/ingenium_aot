/* eslint-disable @next/next/no-img-element */
import type { BlogImage as BlogImageType } from "../../types/types";
import { resolveCmsImageSrc } from "@/lib/cms";

export default function BlogImage({ image }: { image: BlogImageType }) {
  if (!image.id) return null;

  return (
    <figure className="my-12 w-full">
      <div className="relative w-full aspect-video md:aspect-21/9 rounded-xl overflow-hidden shadow-xl bg-gray-100 border border-gray-100">
        <img
          src={resolveCmsImageSrc(image.id)}
          alt={image.caption || "Article illustration"}
          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        />
      </div>
      {image.caption && (
        <figcaption className="text-center text-sm text-gray-500 mt-3 font-medium italic">
          {image.caption}
        </figcaption>
      )}
    </figure>
  );
}
