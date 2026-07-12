// app/dashboard/employee/assets/[id]/page.tsx
import { AppShell } from "@/components/user/app-shell";
import { AssetDetailsClient } from "@/components/employee/asset-details-client";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell active="/dashboard/employee/assets">
      <AssetDetailsClient allocationId={id} />
    </AppShell>
  );
}
