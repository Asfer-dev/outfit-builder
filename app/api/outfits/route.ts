import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Outfit } from "@/models/Outfit";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  await connectDB();
  const { name, items } = await req.json();
  const outfit = await Outfit.create({
    userId: (session.user as any).id,
    name,
    items,
  });
  return NextResponse.json(outfit);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  await connectDB();
  const outfits = await Outfit.find({ userId: (session.user as any).id });
  return NextResponse.json(outfits);
}
