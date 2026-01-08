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
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto flex justify-end mb-4">
                <button
                    onClick={logout}
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium underline"
                >
                    Sign Out
                </button>
            </div>
            <AssessmentForm />
        </div>
    );
}
