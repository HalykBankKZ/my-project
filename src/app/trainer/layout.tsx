"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const nav = [
  { href: "/trainer", label: "Дашборд", icon: "📊" },
  { href: "/trainer/queue", label: "Очередь", icon: "📬" },
];

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-indigo-600">🎓 GrowVibe</span>
          <span className="text-sm text-gray-400">Кабинет тренера</span>
        </div>
        <nav className="flex gap-2">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== "/trainer" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  active ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
          >
            Выйти
          </button>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
