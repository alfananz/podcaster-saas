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

      {/* Micro-announcement / Footer Info */}
      <footer className="mt-16 flex flex-col md:flex-row items-center justify-between gap-6 p-6 border-t border-white/5 text-white/40 text-sm">
        <div className="flex items-center gap-6">
          <p>© 2023 Mello Studio</p>
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
        </div>
        <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/5">
          <span className="size-2 rounded-full bg-[#0bda87]"></span>
          <p className="text-xs font-medium">System Status: All systems operational</p>
        </div>
      </footer>
    </DashboardLayout>
  );
}
