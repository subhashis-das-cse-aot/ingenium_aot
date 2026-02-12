/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";

import type { CmsGalleryItem } from "@/lib/queries";
import { resolveCmsImageSrc } from "@/lib/cms";

export default function GalleryView({ items }: { items: CmsGalleryItem[] }) {
  const [activeTab, setActiveTab] = useState<"photographs" | "drawings">("photographs");

  const photographs = useMemo(() => items.filter((item) => item.kind === "photograph"), [items]);
  const drawingGroups = useMemo(() => {
    const map = new Map<string, CmsGalleryItem[]>();
    for (const item of items.filter((entry) => entry.kind === "drawing")) {
      const key = item.folderContext || "Drawings";
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return [...map.entries()];
  }, [items]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">Gallery</h1>

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1 ">
            <button
              onClick={() => setActiveTab("photographs")}
              className={`px-6 py-2 rounded-md font-medium transition-colors hover:cursor-pointer ${
                activeTab === "photographs" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Photographs
            </button>
            <button
              onClick={() => setActiveTab("drawings")}
              className={`px-6 py-2 rounded-md font-medium transition-colors hover:cursor-pointer ${
                activeTab === "drawings" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Drawings
            </button>
          </div>
        </div>

        {activeTab === "photographs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photographs.map((photo) => (
              <div
                key={photo.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-72 bg-gray-200 relative">
                  <img
                    src={resolveCmsImageSrc(photo.imageId)}
                    alt={photo.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{photo.title}</h3>
                  <div className="text-xs text-gray-500">
                    <p>By: {photo.photographer.name}</p>
                    <p>
                      {photo.photographer.dept} - {photo.photographer.year} Year
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "drawings" && (
          <div>
            {drawingGroups.map(([context, files]) => (
              <div key={context} className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-blue-600">{context}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="h-64 bg-gray-200 relative">
                        <img
                          src={resolveCmsImageSrc(file.imageId)}
                          alt={file.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-blue-600 font-medium mb-2">Rank: {file.rank}</p>
                        <div className="text-xs text-gray-500">
                          <p>By: {file.photographer.name}</p>
                          <p>
                            {file.photographer.dept} - {file.photographer.year} Year
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
