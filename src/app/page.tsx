import Link from "next/link";
import { getDb } from "@/db";
import { participants, contests } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = getDb();

  const [{ count: participantCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(participants);
  const [{ count: contestCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contests);
  const recentContests = await db
    .select()
    .from(contests)
    .orderBy(desc(contests.date))
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your contest tracking data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Participants"
          value={participantCount}
          href="/participants"
        />
        <StatCard
          title="Total Contests"
          value={contestCount}
          href="/contests"
        />
        <StatCard
          title="Recent Contests"
          value={recentContests.length}
          subtitle="last 5"
          href="/contests"
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Contests</h2>
        {recentContests.length === 0 ? (
          <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">
            No contests yet.{" "}
            <Link href="/contests" className="text-foreground underline">
              Create one
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-2">
            {recentContests.map((c) => (
              <Link
                key={c.id}
                href={`/contests/${c.id}`}
                className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(c.date).toLocaleDateString()}
                  </span>
                </div>
                {c.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                    {c.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  href,
}: {
  title: string;
  value: number;
  subtitle?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border p-5 transition-colors hover:bg-muted/50"
    >
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </Link>
  );
}
