import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    orderBy: { id: "asc" },
  });

  if (membership?.role === "teacher") redirect("/trainer");
  if (membership?.role === "admin") redirect("/admin");
  redirect("/student");
}
