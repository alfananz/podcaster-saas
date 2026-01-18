export function StatsSection() {
    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass p-8 rounded-3xl flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">database</span>
                    <span className="text-[#0bda87] text-sm font-bold bg-[#0bda87]/10 px-3 py-1 rounded-full">+12%</span>
                </div>
                <div>
                    <p className="text-white/50 text-sm font-medium uppercase tracking-widest">Total Storage</p>
                    <p className="text-3xl font-black mt-1">1.2 TB</p>
                </div>
            </div>

            <div className="glass p-8 rounded-3xl flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <span className="material-symbols-outlined text-mello-blue bg-mello-blue/10 p-2 rounded-xl">download_for_offline</span>
                    <span className="text-[#0bda87] text-sm font-bold bg-[#0bda87]/10 px-3 py-1 rounded-full">+5.4%</span>
                </div>
                <div>
                    <p className="text-white/50 text-sm font-medium uppercase tracking-widest">Monthly Downloads</p>
                    <p className="text-3xl font-black mt-1">45.8k</p>
                </div>
            </div>

            <div className="glass p-8 rounded-3xl flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <span className="material-symbols-outlined text-purple-400 bg-purple-400/10 p-2 rounded-xl">rocket_launch</span>
                    <span className="text-[#0bda87] text-sm font-bold bg-[#0bda87]/10 px-3 py-1 rounded-full">+2</span>
                </div>
                <div>
                    <p className="text-white/50 text-sm font-medium uppercase tracking-widest">Active Projects</p>
                    <p className="text-3xl font-black mt-1">12</p>
                </div>
            </div>
        </section>
    );
}
