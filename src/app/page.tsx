"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, login, logout, loading } = useAuth();
  const router = useRouter();

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#050505] text-cyan-400">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white overflow-hidden relative">
      {/* Background Gradient/Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl -z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

      <div className="max-w-md w-full p-10 gradient-border shadow-2xl relative z-10 mx-4">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white drop-shadow-sm">
            PUNX <span className="text-gradient">Micro-Learning</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Internal Employee Self-Assessment
          </p>
        </div>
        <div className="mt-10 space-y-6">
          {user ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-gray-300 text-sm">Logged in as</p>
                <p className="font-bold text-white text-lg">{user.displayName}</p>
                <p className="text-gray-500 text-xs">{user.email}</p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Navigating to assessment...");
                  router.push("/assessment");
                }}
                className="w-full flex justify-center py-3 px-4 rounded-lg text-black bg-cyan-400 hover:bg-cyan-300 font-bold transition-all shadow-lg hover:shadow-cyan-400/20 active:scale-95 transform duration-150"
              >
                Continue to Assessment
              </button>
              <button
                onClick={() => logout()}
                className="text-sm text-gray-500 hover:text-white transition-colors underline decoration-gray-700 hover:decoration-white"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => login()}
              className="group relative w-full flex justify-center py-4 px-4 border border-white/20 text-sm font-bold rounded-lg text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all hover:border-cyan-400/50"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {/* Google G Icon or similar could go here */}
              </span>
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
