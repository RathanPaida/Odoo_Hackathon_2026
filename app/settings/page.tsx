// app/settings/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { SettingsForms } from "@/components/user/settings-forms";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <AppShell active="/settings">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold">Account settings</h1>
        <SettingsForms />
      </div>
    </AppShell>
  );
}
