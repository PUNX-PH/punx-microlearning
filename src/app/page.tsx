"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, login, logout, loading } = useAuth();
  const router = useRouter();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-xl rounded-xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            PUNX Micro-Learning
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Internal Employee Self-Assessment
          </p>
        </div>
        <div className="mt-8 space-y-6">
          {user ? (
            <div className="text-center space-y-4">
              <p className="text-gray-700">You are logged in as <span className="font-bold">{user.displayName}</span></p>
              <button
                onClick={() => router.push("/assessment")}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 font-bold"
              >
                Continue to Assessment
              </button>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
