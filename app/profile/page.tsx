// app/profile/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { ProfileForm } from "@/components/user/profile-form";
import { getCurrentUser } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/services/user-service";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const pu = toPublicUser(user as any);

  return (
    <AppShell active="/profile">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <div className="card">
          <ProfileForm user={pu} />
        </div>
      </div>
    </AppShell>
  );
}
