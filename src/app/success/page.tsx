"use client";

import Link from "next/link";

export default function SuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white relative overflow-hidden">
            {/* Background Gradient/Glow Effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl -z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-900/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

            <div className="gradient-border max-w-md w-full p-10 shadow-2xl text-center relative z-10 mx-4">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 shadow-[0_0_20px_rgba(74,222,128,0.3)] mb-6">
                    <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">All set!</h2>
                <p className="text-gray-400 mb-8">
                    Thanks! Your learning plan will adapt starting next cycle.
                </p>

                <div>
                    <Link href="/" className="inline-block w-full py-3 px-4 rounded-xl text-black bg-cyan-400 hover:bg-cyan-300 font-bold transition-all shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)]">
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
