"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [slug, setSlug] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Auto-format the slug: lowercase, no spaces, only letters/numbers/hyphens
  function handleSlugChange(value: string) {
    const cleaned = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
    setSlug(cleaned)
  }

  async function handleSignup() {
    setLoading(true)
    setError("")

    // 1. Check the slug isn't already taken
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (existing) {
      setError("That link is already taken — try another.")
      setLoading(false)
      return
    }

    // 2. Create the auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? "Something went wrong.")
      setLoading(false)
      return
    }

    // 3. Create the business row linked to the new user
    const { error: bizError } = await supabase.from("businesses").insert({
      name: businessName,
      slug: slug,
      owner_id: authData.user.id,
    })

    setLoading(false)

    if (bizError) {
      setError("Account created but business setup failed. Contact support.")
      console.error(bizError)
      return
    }

    // 4. Send them to their dashboard
    router.push("/dashboard")
    router.refresh()
  }

  const canSubmit = email && password.length >= 6 && businessName && slug

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-8">
        <h1 className="text-lg font-medium text-gray-900 mb-1">Create your page</h1>
        <p className="text-xs text-gray-500 mb-6">Set up your booking page in 60 seconds.</p>

        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business name"
          className="w-full p-3 mb-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400"
        />

        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden mb-3">
          <span className="px-3 py-3 bg-gray-50 text-sm text-gray-400 border-r border-gray-200">
            trim.com/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="your-name"
            className="flex-1 p-3 text-sm text-gray-900 placeholder-gray-400 outline-none"
          />
        </div>

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
          placeholder="Password (min 6 characters)"
          className="w-full p-3 mb-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400"
        />

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <button
          onClick={handleSignup}
          disabled={!canSubmit || loading}
          className={`w-full py-3 text-sm font-medium rounded-lg ${
            !canSubmit || loading
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-700"
          }`}
        >
          {loading ? "Creating..." : "Create my page"}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-gray-900 underline">Log in</a>
        </p>
      </div>
    </main>
  )
}