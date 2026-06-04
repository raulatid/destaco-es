import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/sidebar";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Panel de administracion",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:px-8">
      <AdminSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
