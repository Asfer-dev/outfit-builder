"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import type { Category, OutfitItem, OutfitSelection } from "../types";

const CATEGORIES: Category[] = ["Top", "Bottom", "Shoes", "Hijab", "Accessory"];

type SavedOutfit = {
  _id: string;
  name: string;
  items: {
    category: Category;
    name: string;
    imageUrl: string;
  }[];
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [items, setItems] = useState<OutfitItem[]>([]);
  const [outfit, setOutfit] = useState<OutfitSelection>({});
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [isSavingOutfit, setIsSavingOutfit] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // form state
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState<Category>("Top");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // outfit name
  const [outfitName, setOutfitName] = useState("");

  // drag state (for highlighting drop zone)
  const [activeDropCategory, setActiveDropCategory] = useState<Category | null>(
    null
  );

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Load wardrobe & outfits when logged in
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return;
      try {
        setIsLoadingData(true);

        const itemsRes = await fetch("/api/items");
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          const normalizedItems: OutfitItem[] = itemsData.map((doc: any) => ({
            id: doc._id || doc.id,
            name: doc.name,
            category: doc.category as Category,
            imageUrl: doc.imageUrl,
          }));
          setItems(normalizedItems);
        }

        const outfitsRes = await fetch("/api/outfits");
        if (outfitsRes.ok) {
          const outfitsData = await outfitsRes.json();
          setSavedOutfits(outfitsData);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (status === "authenticated") {
      fetchData();
    }
  }, [session, status]);

  // Upload item (Cloudinary + Mongo)
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Please choose an image.");
      return;
    }

    try {
      setIsUploading(true);

      // Upload image
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      // Save item in DB
      const createRes = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: itemName || itemCategory + " item",
          category: itemCategory,
          imageUrl,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create wardrobe item");
      }

      const savedItem = await createRes.json();

      const newItem: OutfitItem = {
        id: savedItem._id || savedItem.id,
        name: savedItem.name,
        category: savedItem.category as Category,
        imageUrl: savedItem.imageUrl,
      };

      setItems((prev) => [...prev, newItem]);

      // reset
      setItemName("");
      setFile(null);
      const input = document.getElementById(
        "image-input"
      ) as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while uploading.");
    } finally {
      setIsUploading(false);
    }
  };

  // Outfit interactions
  const handleSelectForOutfit = (item: OutfitItem) => {
    setOutfit((prev) => ({
      ...prev,
      [item.category]: item,
    }));
  };

  const itemsByCategory = (category: Category) =>
    items.filter((item) => item.category === category);

  // DRAG HELPERS
  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    itemId: string
  ) => {
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.effectAllowed = "copyMove";
  };

  const handleDragOverDropZone = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDropOnCategory = (
    e: React.DragEvent<HTMLDivElement>,
    cat: Category
  ) => {
    e.preventDefault();
    setActiveDropCategory(null);

    const itemId = e.dataTransfer.getData("text/plain");
    if (!itemId) return;

    const item = items.find((it) => it.id === itemId);
    if (!item) return;

    setOutfit((prev) => ({
      ...prev,
      [cat]: item,
    }));
  };

  const handleDragEnterCategory = (cat: Category) => {
    setActiveDropCategory(cat);
  };

  const handleDragLeaveCategory = (cat: Category) => {
    setActiveDropCategory((current) => (current === cat ? null : current));
  };

  // Save outfit
  const handleSaveOutfit = async () => {
    setError(null);
    const chosenItems = Object.entries(outfit).filter(
      ([, value]) => value !== undefined
    );
    if (chosenItems.length === 0) {
      setError("Add at least one item to the outfit before saving.");
      return;
    }

    try {
      setIsSavingOutfit(true);

      const itemsPayload = chosenItems.map(([category, item]) => ({
        category,
        name: (item as OutfitItem).name,
        imageUrl: (item as OutfitItem).imageUrl,
      }));

      const res = await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: outfitName || "Untitled outfit",
          items: itemsPayload,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save outfit.");
      }

      const saved = await res.json();
      setSavedOutfits((prev) => [...prev, saved]);
      setOutfitName("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while saving outfit.");
    } finally {
      setIsSavingOutfit(false);
    }
  };

  // Load saved outfit into builder
  const handleLoadOutfit = (saved: SavedOutfit) => {
    const selection: OutfitSelection = {};
    saved.items.forEach((it) => {
      selection[it.category] = {
        id: `${saved._id}-${it.category}-${it.name}`,
        name: it.name,
        category: it.category,
        imageUrl: it.imageUrl,
      };
    });
    setOutfit(selection);
  };

  // Loading state while session is checking or redirecting
  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-rose-50">
        <p className="text-sm text-rose-500">Checking your session...</p>
      </main>
    );
  }

  // From here, user is authenticated
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-rose-100 to-rose-200 text-rose-950">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-rose-900">
              Outfit Builder
            </h1>
            <p className="text-sm md:text-base text-rose-600">
              Upload your wardrobe pieces, drag them into outfits, and save your
              favourite looks.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-rose-600 hidden sm:block">
              Signed in as{" "}
              <span className="font-medium">{session?.user?.email}</span>
            </p>
            <button
              onClick={() => signOut()}
              className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        {isLoadingData && (
          <p className="text-xs text-rose-500 mb-4">
            Loading your wardrobe and outfits...
          </p>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)]">
          {/* Left: Uploader & Wardrobe & Saved Outfits */}
          <section className="space-y-6">
            {/* Add item */}
            <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-rose-100 p-5 md:p-6">
              <h2 className="text-lg font-semibold mb-3 text-rose-900">
                Add a new item
              </h2>
              <form className="space-y-4" onSubmit={handleUpload}>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-rose-800">
                    Item name
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Soft pink abaya"
                    className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-rose-50/60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-rose-800">
                    Category
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) =>
                      setItemCategory(e.target.value as Category)
                    }
                    className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-rose-50/60"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-rose-800">
                    Image
                  </label>
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFile(e.target.files ? e.target.files[0] : null)
                    }
                    className="block w-full text-sm text-rose-700 file:mr-3 file:rounded-xl file:border-0 file:bg-pink-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-pink-200 cursor-pointer"
                  />
                  <p className="text-xs text-rose-500">
                    Clear photos with plain, light backgrounds look best.
                  </p>
                </div>

                {error && (
                  <p className="text-xs text-rose-700 bg-rose-50 rounded-lg px-3 py-2 border border-rose-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isUploading || !file}
                  className="inline-flex items-center justify-center rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-pink-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploading ? "Uploading..." : "Upload item"}
                </button>
              </form>
            </div>

            {/* Wardrobe */}
            <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-rose-100 p-5 md:p-6">
              <h2 className="text-lg font-semibold mb-3 text-rose-900">
                Your wardrobe
              </h2>
              {items.length === 0 && (
                <p className="text-sm text-rose-500">
                  No items yet. Upload a few tops, bottoms, shoes, hijabs etc.
                </p>
              )}

              <div className="space-y-4">
                {CATEGORIES.map((cat) => {
                  const list = itemsByCategory(cat);
                  if (list.length === 0) return null;

                  return (
                    <div key={cat}>
                      <h3 className="text-sm font-semibold text-rose-800 mb-2">
                        {cat}
                      </h3>
                      <div className="flex gap-3 overflow-x-auto pb-1">
                        {list.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            draggable
                            onClick={() => handleSelectForOutfit(item)}
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            className="group relative flex-shrink-0 w-24 h-28 rounded-xl border border-rose-200 overflow-hidden bg-rose-50 hover:border-pink-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-[70%] object-cover"
                            />
                            <div className="h-[30%] px-2 py-1 flex items-center justify-center bg-white/70">
                              <p className="text-[10px] text-center text-rose-800 line-clamp-2">
                                {item.name}
                              </p>
                            </div>
                            <span className="absolute inset-0 rounded-xl ring-2 ring-pink-300/0 group-hover:ring-pink-300/70 pointer-events-none" />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Saved outfits */}
            <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-rose-100 p-5 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-rose-900">
                  My outfits
                </h2>
                <span className="text-[11px] text-rose-400">
                  {savedOutfits.length} saved
                </span>
              </div>
              {savedOutfits.length === 0 ? (
                <p className="text-sm text-rose-500">
                  No outfits saved yet. Build a look and save it.
                </p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {savedOutfits.map((o) => (
                    <button
                      key={o._id}
                      type="button"
                      onClick={() => handleLoadOutfit(o)}
                      className="w-full text-left rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 hover:bg-pink-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-rose-900">
                        {o.name}
                      </p>
                      <p className="text-[11px] text-rose-500">
                        {o.items.map((it) => it.category).join(" • ")}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Right: Outfit builder */}
          <section className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-rose-100 p-5 md:p-6 flex flex-col">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-rose-900">
                  Current outfit
                </h2>
                <p className="text-sm text-rose-600">
                  Drag items from your wardrobe and drop them on any slot.
                </p>
              </div>

              <div className="flex flex-col sm:items-end gap-2">
                <input
                  type="text"
                  value={outfitName}
                  onChange={(e) => setOutfitName(e.target.value)}
                  placeholder="Outfit name (optional)"
                  className="w-full sm:w-56 rounded-xl border border-rose-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-rose-50/60"
                />
                <button
                  type="button"
                  onClick={handleSaveOutfit}
                  disabled={isSavingOutfit}
                  className="inline-flex items-center justify-center rounded-xl bg-fuchsia-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-fuchsia-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isSavingOutfit ? "Saving..." : "Save outfit"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {CATEGORIES.map((cat) => {
                const selected = outfit[cat];
                const isActive = activeDropCategory === cat;

                return (
                  <div
                    key={cat}
                    onDragOver={handleDragOverDropZone}
                    onDrop={(e) => handleDropOnCategory(e, cat)}
                    onDragEnter={() => handleDragEnterCategory(cat)}
                    onDragLeave={() => handleDragLeaveCategory(cat)}
                    className={[
                      "rounded-2xl border border-dashed bg-rose-50/70 p-2 flex flex-col items-center justify-center text-center min-h-[140px] transition-all",
                      isActive
                        ? "border-pink-400 bg-pink-50 shadow-sm"
                        : "border-rose-200",
                    ].join(" ")}
                  >
                    <p className="text-xs font-medium text-rose-600 mb-1">
                      {cat}
                    </p>
                    {selected ? (
                      <>
                        <div className="w-full h-24 rounded-xl overflow-hidden mb-1 bg-white shadow-sm">
                          <img
                            src={selected.imageUrl}
                            alt={selected.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[11px] text-rose-800 px-1 line-clamp-2">
                          {selected.name}
                        </p>
                      </>
                    ) : (
                      <p className="text-[11px] text-rose-400 px-3">
                        Drop a {cat.toLowerCase()} here
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-auto flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setOutfit({})}
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors self-start"
              >
                Clear outfit
              </button>

              <p className="text-xs text-rose-500">
                You can still click items if dragging is not convenient. Saved
                outfits appear in the list on the left so you can reuse them
                anytime.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
