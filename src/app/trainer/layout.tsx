"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const nav = [
  { href: "/trainer", label: "Дашборд", icon: "📊" },
  { href: "/trainer/queue", label: "Очередь проверки", icon: "📬" },
];

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-purple-700 text-white px-6 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <span className="font-bold text-lg">GrowVibe</span>
            <span className="text-xs bg-purple-500 px-2 py-0.5 rounded-full font-medium">Тренер</span>
          </div>
          <nav className="flex gap-1">
            {nav.map((item) => {
              const active =
                item.href === "/trainer"
                  ? pathname === "/trainer"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    active
                      ? "bg-white/20 text-white"
                      : "text-purple-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session?.user && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold">
                {session.user.name?.charAt(0)}
              </div>
              <span className="text-sm text-purple-100">{session.user.name}</span>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="text-sm text-purple-200 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition"
          >
            Выйти
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
