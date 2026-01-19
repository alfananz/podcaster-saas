"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Mock login logic
    setTimeout(() => {
      if (username === "admin" && password === "admin") {
        router.push("/dashboard");
      } else {
        setError("Invalid credentials. Try admin/admin");
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="bg-[#0c0c0d] min-h-screen flex items-center justify-center relative overflow-hidden font-display">
      {/* Background Aurora Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[15%] left-[30%] w-[500px] h-[500px] rounded-full bg-[#30C7F5] blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
            x: [0, -40, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[20%] right-[25%] w-[600px] h-[600px] rounded-full bg-[#A633EB] blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [20, -20, 20],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#df37f6]/40 blur-[120px]"
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1200px] px-6 flex flex-col items-center">
        {/* Header / Logo Area */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <div className="flex items-center justify-center gap-3 text-white mb-2">
            <div className="size-8">
              <svg className="text-[#df37f6]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="text-white text-2xl font-extrabold tracking-[0.2em] uppercase">Mello Studio</h1>
          </div>
          <p className="text-white/40 text-xs font-medium tracking-[0.3em] uppercase">Podcast OS System</p>
        </motion.div>

        {/* Obsidian Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-[#121214] border border-white/10 w-full max-w-[460px] rounded-xl p-10 backdrop-blur-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.8)]"
        >
          <div className="mb-8">
            <h2 className="text-white text-3xl font-bold tracking-tight mb-2">Access Portal</h2>
            <p className="text-white/50 text-sm font-light">Please enter the credentials that has been shared with you.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="flex flex-col gap-2">
              <label className="text-white/70 text-xs font-bold uppercase tracking-widest pl-1">Username</label>
              <div className="relative group">
                <input
                  className="w-full bg-[#1c1c1f] border border-white/10 rounded-lg h-14 px-5 text-white placeholder:text-white/20 focus:outline-none focus:border-[#df37f6]/50 focus:ring-1 focus:ring-[#df37f6]/30 transition-all"
                  placeholder="Email or Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-white/70 text-xs font-bold uppercase tracking-widest">Password</label>
                <a className="text-[#df37f6]/60 hover:text-[#df37f6] text-[10px] font-bold uppercase tracking-tighter transition-colors" href="#">Forgot Your Password?</a>
              </div>
              <div className="relative flex items-stretch rounded-lg group">
                <input
                  className="w-full bg-[#1c1c1f] border border-white/10 rounded-lg h-14 px-5 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-[#df37f6]/50 focus:ring-1 focus:ring-[#df37f6]/30 transition-all"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-500 text-xs font-bold tracking-wide text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Action Button */}
            <div className="pt-4">
              <button
                className="relative overflow-hidden w-full bg-[#df37f6] hover:bg-[#df37f6]/90 text-white h-14 rounded-lg font-extrabold tracking-[0.1em] uppercase transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={isLoading}
              >
                {/* Shimmer Effect */}
                <motion.div
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                />
                <span>{isLoading ? "Authenticating..." : "Sign In"}</span>
                {!isLoading && (
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                )}
              </button>
            </div>
          </form>

          {/* Bottom Links */}
          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
            <p className="text-white/40 text-xs">Don't have an access key?</p>
            <a className="text-white font-bold text-sm tracking-tight hover:text-[#df37f6] transition-colors flex items-center gap-2" href="#">
              Request Agency Membership
            </a>
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-12 flex items-center gap-2"
        >
          <div className="size-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white text-[10px] font-bold uppercase tracking-[0.2em]">Developed By Mello Studio</span>
        </motion.div>
      </div>

      {/* Navigation Overlay */}
      <nav className="fixed top-0 left-0 w-full p-8 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto">
          <div className="text-white/20 text-[10px] font-black tracking-[0.4em] uppercase -rotate-90 origin-left translate-y-20">
            Mello © 2026
          </div>
        </div>
        <div className="pointer-events-auto flex gap-8">
          <a className="text-white/30 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors" href="#">Support</a>
          <a className="text-white/30 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors" href="#">Legal</a>
        </div>
      </nav>
    </div>
  );
}
