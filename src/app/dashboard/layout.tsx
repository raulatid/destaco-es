import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PendingFeatureBanner } from "@/components/dashboard/pending-feature-banner";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Mi panel",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:px-8">
      <DashboardSidebar />
      <div className="min-w-0 flex-1">
        <PendingFeatureBanner email={session.user.email} />
        {children}
      </div>
    </div>
  );
}
