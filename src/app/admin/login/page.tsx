"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SupervisorLoginPage() {
    const { user, login } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push("/admin");
        }
    }, [user, router]);

    const handleLogin = () => {
        // Pass the redirect path to the login function
        login("/admin");
    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden">
            {/* Background Gradient/Glow Effects */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-900/20 rounded-full blur-3xl -z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

            <div className="max-w-md w-full p-10 gradient-border shadow-2xl relative z-10 mx-4 text-center">
                <div>
                    <span className="inline-block px-3 py-1 bg-yellow-900/30 text-yellow-300 border border-yellow-500/30 text-xs font-bold uppercase tracking-wide rounded-full mb-4">
                        Supervisor Access
                    </span>
                    <h2 className="text-3xl font-extrabold text-white">
                        Admin <span className="text-gradient">Portal</span>
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">
                        PUNX Micro-Learning Engine
                    </p>
                </div>
                <div className="mt-8">
                    <button
                        onClick={handleLogin}
                        className="group relative w-full flex justify-center py-3 px-4 rounded-xl text-black bg-cyan-400 hover:bg-cyan-300 font-bold transition-all shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)]"
                    >
                        Sign in as Supervisor
                    </button>
                    <p className="mt-4 text-center text-xs text-gray-500">
                        Restricted area. Authorized personnel only.
                    </p>
                </div>
            </div>
        </div>
    );
}
