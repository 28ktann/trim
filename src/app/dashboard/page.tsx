"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type Booking = {
  id: string
  customer_name: string
  customer_phone: string
  booking_time: string
  services: { name: string; price: number } | null
}

type Service = {
  id: string
  name: string
  duration_minutes: number
  price: number
}

type Business = {
  id: string
  name: string
}

export default function Dashboard() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  // New service form fields
  const [newName, setNewName] = useState("")
  const [newDuration, setNewDuration] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [adding, setAdding] = useState(false)

  async function loadServices(businessId: string) {
    const { data } = await supabase
      .from("services")
      .select("id, name, duration_minutes, price")
      .eq("business_id", businessId)
      .order("price", { ascending: true })
    setServices(data ?? [])
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("owner_id", user.id)
        .single()

      if (!biz) {
        setLoading(false)
        return
      }
      setBusiness(biz)

      const { data: bookingData } = await supabase
        .from("bookings")
        .select("id, customer_name, customer_phone, booking_time, services(name, price)")
        .eq("business_id", biz.id)
        .order("booking_time", { ascending: true })
      setBookings((bookingData as any) ?? [])

      await loadServices(biz.id)
      setLoading(false)
    }

    load()
  }, [router])

  async function handleAddService() {
    if (!business || !newName || !newDuration || !newPrice) return
    setAdding(true)

    const { error } = await supabase.from("services").insert({
      business_id: business.id,
      name: newName,
      duration_minutes: Number(newDuration),
      price: Number(newPrice),
    })

    setAdding(false)

    if (error) {
      console.error("Error adding service:", error)
      alert("Could not add service.")
      return
    }

    setNewName("")
    setNewDuration("")
    setNewPrice("")
    await loadServices(business.id)
  }

  async function handleDeleteService(id: string) {
    if (!business) return
    const { error } = await supabase.from("services").delete().eq("id", id)
    if (error) {
      console.error("Error deleting service:", error)
      alert("Could not delete service.")
      return
    }
    await loadServices(business.id)
  }

  const totalBookings = bookings.length
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.services?.price || 0), 0)

  const initials = business?.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? ""

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-medium text-sm">
              {initials}
            </div>
            <div>
              <h1 className="text-lg font-medium text-gray-900">{business?.name}</h1>
              <p className="text-xs text-gray-500">Owner dashboard</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-900">
            Log out
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total bookings</p>
            <p className="text-2xl font-medium text-gray-900">{totalBookings}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total revenue</p>
            <p className="text-2xl font-medium text-gray-900">£{totalRevenue}</p>
          </div>
        </div>

        {/* SERVICES MANAGER */}
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">Your services</p>

        <div className="flex flex-col gap-2 mb-4">
          {services.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500">No services yet — add your first below.</p>
            </div>
          ) : (
            services.map((s) => (
              <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.duration_minutes} min · £{s.price}</p>
                </div>
                <button
                  onClick={() => handleDeleteService(s.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {/* ADD SERVICE FORM */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8">
          <p className="text-xs font-medium text-gray-700 mb-3">Add a service</p>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Service name (e.g. Gel manicure)"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                placeholder="Duration (min)"
                className="flex-1 p-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400"
              />
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Price (£)"
                className="flex-1 p-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400"
              />
            </div>
            <button
              onClick={handleAddService}
              disabled={!newName || !newDuration || !newPrice || adding}
              className={`w-full py-2.5 text-sm font-medium rounded-lg ${
                !newName || !newDuration || !newPrice || adding
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-700"
              }`}
            >
              {adding ? "Adding..." : "Add service"}
            </button>
          </div>
        </div>

        {/* BOOKINGS */}
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">Upcoming bookings</p>

        {bookings.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-sm text-gray-500">No bookings yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{booking.customer_name}</p>
                  <p className="text-xs text-gray-500">
                    {booking.services?.name} · {booking.customer_phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(booking.booking_time).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(booking.booking_time).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}