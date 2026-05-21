import { createClient } from "@/lib/supabase/server";
import { formatKg } from "@/lib/utils";

export const metadata = { title: "History" };

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("calculations")
    .select("id, calc_type, total_kgco2e, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl text-forest-900">History</h1>
      <p className="mt-3 text-ink-500">
        Every calculation you&apos;ve saved. Diff between consecutive runs
        coming in a future build.
      </p>

      <div className="mt-10 overflow-hidden rounded-card border border-forest-700/10 bg-bone-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-forest-700/5 text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest-700/10">
            {!rows || rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-ink-400">
                  No calculations yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="text-ink-700">
                  <td className="px-4 py-3 tabular">
                    {new Date(r.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {r.calc_type.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-right tabular text-ink-900">
                    {formatKg(Number(r.total_kgco2e))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
