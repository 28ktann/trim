"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-8">
        <h1 className="text-lg font-medium text-gray-900 mb-6">Owner login</h1>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 mb-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 mb-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400"
        />

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          className={`w-full py-3 text-sm font-medium rounded-lg ${
            loading || !email || !password
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-700"
          }`}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </main>
  )
}