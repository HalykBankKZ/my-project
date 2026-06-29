import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const role = session.user.role ?? "student";
  if (role === "admin") redirect("/admin");
  if (role === "teacher") redirect("/trainer");
  redirect("/student");
}
