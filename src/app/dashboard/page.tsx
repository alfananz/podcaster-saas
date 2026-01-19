import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsSection } from "@/components/dashboard/StatsSection";
import { EpisodeGrid } from "@/components/dashboard/EpisodeGrid";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function Home() {
  return (
    <DashboardLayout>
      {/* Top Bar / Page Heading */}
      <DashboardHeader />

      {/* Stats Section */}
      <StatsSection />

      {/* Section Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        <h3 className="text-2xl font-bold">Active Episodes</h3>
        <button className="text-primary font-bold text-sm hover:underline cursor-pointer">View All Episodes</button>
      </div>

      {/* Episode Grid */}
      <EpisodeGrid />


    </DashboardLayout>
  );
}
