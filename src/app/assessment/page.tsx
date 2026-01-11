"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AssessmentForm from "@/components/AssessmentForm";

export default function AssessmentPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        }
    }, [user, loading, router]);

    if (loading || !user) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#050505] py-12 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden">
            {/* Background Gradient/Glow Effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

            <div className="max-w-4xl mx-auto flex justify-end mb-4 relative z-10">
                <button
                    onClick={() => logout()}
                    className="text-sm text-gray-400 hover:text-white font-medium underline transition-colors"
                >
                    Sign Out
                </button>
            </div>
            <div className="relative z-10">
                <AssessmentForm />
            </div>
        </div>
    );
}
