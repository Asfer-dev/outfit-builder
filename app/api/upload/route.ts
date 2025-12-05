import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

// This will automatically use process.env.CLOUDINARY_URL
cloudinary.config({
  secure: true,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert the File into a format Cloudinary accepts (base64 data URL)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type; // e.g. 'image/jpeg'
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: "outfit-builder", // optional folder name
    });

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
