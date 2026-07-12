import { redirect } from "next/navigation";

export default function OrgSetupRedirect() {
  redirect("/dashboard/admin/org/departments");
}
