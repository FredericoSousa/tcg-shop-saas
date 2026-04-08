import { DashboardSkeleton } from "@/components/admin/skeletons/admin-skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="p-6">
      <DashboardSkeleton />
    </div>
  );
}
