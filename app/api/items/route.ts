// app/api/items/route.ts
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { WardrobeItem } from "@/models/WardrobeItem";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  await connectDB();

  const userId = (session.user as any).id;
  const items = await WardrobeItem.find({ userId }).sort({ createdAt: -1 });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, category, imageUrl } = body;

  if (!name || !category || !imageUrl) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  await connectDB();

  const userId = (session.user as any).id;

  const item = await WardrobeItem.create({
    userId,
    name,
    category,
    imageUrl,
  });

  return NextResponse.json(item);
}
