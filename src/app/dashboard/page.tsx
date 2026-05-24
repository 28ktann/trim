"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

type Booking = {
  id: string
  customer_name: string
  customer_phone: string
  booking_time: string
  services: { name: string; price: number } | null
}

export default function Dashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBookings() {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, customer_name, customer_phone, booking_time, services(name, price)")
        .order("booking_time", { ascending: true })

      if (error) {
        console.error("Error loading bookings:", error)
      } else {
        setBookings(data as any)
      }
      setLoading(false)
    }

    loadBookings()
  }, [])

  // Calculate summary stats
  const totalBookings = bookings.length
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.services?.price || 0), 0)

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-medium text-sm">
            CN
          </div>
          <div>
            <h1 className="text-lg font-medium text-gray-900">Cosmos Nail Lounge</h1>
            <p className="text-xs text-gray-500">Owner dashboard</p>
          </div>
        </div>

        {/* Stats */}
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

        {/* Bookings list */}
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">
          Upcoming bookings
        </p>

        {loading ? (
          <p className="text-sm text-gray-400">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-sm text-gray-500">No bookings yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
              >
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