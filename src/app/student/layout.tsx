"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const nav = [
  { href: "/student", label: "Главная", icon: "🏠" },
  { href: "/student/missions", label: "Миссии", icon: "📋" },
  { href: "/student/profile", label: "Профиль", icon: "👤" },
  { href: "/student/rankings", label: "Рейтинг", icon: "🏆" },
  { href: "/student/medals", label: "Медали", icon: "🎖️" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-white shadow-sm">
      <main className="flex-1 pb-20">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-200 flex z-50">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/student" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs gap-1 transition ${
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
          className="flex-1 flex flex-col items-center py-2 text-xs gap-1 text-gray-400 hover:text-red-500 transition"
        >
          <span className="text-xl">🚪</span>
          <span>Выход</span>
        </button>
      </nav>
    </div>
  );
}
