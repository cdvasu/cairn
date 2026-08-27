import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { DataProvider } from "@/components/DataProvider";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <DataProvider userId={user.id}>
      <AppShell email={user.email ?? ""}>{children}</AppShell>
    </DataProvider>
  );
}
