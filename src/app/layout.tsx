import type { Metadata } from "next";
import Link from "next/link";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Contest Winner Tracker",
  description: "Track contest participants, winners, and payouts",
};

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <header className="border-b border-border">
          <nav className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
            <Link
              href="/"
              className="text-base font-semibold tracking-tight text-foreground"
            >
              Contest Tracker
            </Link>
            <div className="flex items-center gap-4">
              <NavLink href="/">Dashboard</NavLink>
              <NavLink href="/participants">Participants</NavLink>
              <NavLink href="/contests">Contests</NavLink>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
