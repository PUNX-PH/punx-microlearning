"use client";

import Link from "next/link";

export default function SuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white shadow-xl rounded-xl text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">All set!</h2>
                <p className="mt-4 text-lg text-gray-600">
                    Thanks! Your learning plan will adapt starting next cycle.
                </p>
                <div className="mt-8">
                    <Link href="/" className="text-indigo-600 hover:text-indigo-500 font-medium">
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
