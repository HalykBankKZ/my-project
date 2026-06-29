"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const nav = [
  { href: "/student", label: "Главная", icon: "🏠" },
  { href: "/student/missions", label: "Миссии", icon: "📋" },
  { href: "/student/profile", label: "Профиль", icon: "👤" },
  { href: "/student/rankings", label: "Рейтинг", icon: "🏆" },
  { href: "/student/medals", label: "Медали", icon: "🎖️" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-white shadow-sm">
      {/* Top bar */}
      <header className="bg-indigo-600 text-white px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎓</span>
          <span className="font-bold text-sm">GrowVibe</span>
          <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded-full">Студент</span>
        </div>
        {session?.user && (
          <span className="text-xs text-indigo-200 truncate max-w-[140px]">{session.user.name}</span>
        )}
      </header>

      <main className="flex-1 pb-20">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-200 flex z-50">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/student" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition ${
                active ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex-1 flex flex-col items-center py-2 text-xs gap-0.5 text-gray-400 hover:text-red-500 transition"
        >
          <span className="text-xl">🚪</span>
          <span>Выход</span>
        </button>
      </nav>
    </div>
  );
}
