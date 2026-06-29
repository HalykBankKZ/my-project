import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { name, email, password, branchId } = await req.json();
  if (!name || !email || !password) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return Response.json({ error: "Email already taken" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, branchId },
    select: { id: true, name: true, email: true },
  });
  return Response.json(user, { status: 201 });
}
