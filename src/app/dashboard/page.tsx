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
  working_days: number[]
  open_time: string
  close_time: string
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

  // Recovery form
  const [recoverName, setRecoverName] = useState("")
  const [recoverSlug, setRecoverSlug] = useState("")
  const [recoverError, setRecoverError] = useState("")
  const [recovering, setRecovering] = useState(false)

  // Working hours
  const [workingDays, setWorkingDays] = useState<number[]>([])
  const [openTime, setOpenTime] = useState("09:00")
  const [closeTime, setCloseTime] = useState("17:00")
  const [savingHours, setSavingHours] = useState(false)
  const [hoursMessage, setHoursMessage] = useState("")

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
        .select("id, name, working_days, open_time, close_time")
        .eq("owner_id", user.id)
        .single()

      if (!biz) {
        setLoading(false)
        return
      }
      setBusiness(biz)
      setWorkingDays(biz.working_days ?? [1, 2, 3, 4, 5])
      setOpenTime((biz.open_time ?? "09:00").slice(0, 5))
      setCloseTime((biz.close_time ?? "17:00").slice(0, 5))

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

  const RESERVED_SLUGS = ["login", "signup", "dashboard", "book", "playground", "api", "admin"]

  function handleRecoverSlugChange(value: string) {
    const cleaned = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
    setRecoverSlug(cleaned)
  }

  async function handleRecoverBusiness() {
    setRecovering(true)
    setRecoverError("")

    if (RESERVED_SLUGS.includes(recoverSlug)) {
      setRecoverError("That link is reserved — please choose another.")
      setRecovering(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", recoverSlug)
      .maybeSingle()

    if (existing) {
      setRecoverError("That link is already taken — try another.")
      setRecovering(false)
      return
    }

    const { data: biz, error } = await supabase
      .from("businesses")
      .insert({ name: recoverName, slug: recoverSlug, owner_id: user.id })
      .select("id, name, working_days, open_time, close_time")
      .single()

    setRecovering(false)

    if (error || !biz) {
      setRecoverError("Could not create business. Try again.")
      console.error(error)
      return
    }

    setBusiness(biz)
    setWorkingDays(biz.working_days ?? [1, 2, 3, 4, 5])
    setOpenTime((biz.open_time ?? "09:00").slice(0, 5))
    setCloseTime((biz.close_time ?? "17:00").slice(0, 5))
  }

  function toggleWorkingDay(day: number) {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day))
    } else {
      setWorkingDays([...workingDays, day].sort())
    }
  }

  async function handleSaveHours() {
    if (!business) return
    setSavingHours(true)
    setHoursMessage("")

    const { error } = await supabase
      .from("businesses")
      .update({
        working_days: workingDays,
        open_time: openTime,
        close_time: closeTime,
      })
      .eq("id", business.id)

    setSavingHours(false)

    if (error) {
      console.error("Error saving hours:", error)
      setHoursMessage("Could not save. Try again.")
      return
    }

    setHoursMessage("Saved.")
    setTimeout(() => setHoursMessage(""), 2000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const totalBookings = bookings.length
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.services?.price || 0), 0)

  const initials = business?.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? ""

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </main>
    )
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-8">
          <h1 className="text-lg font-medium text-gray-900 mb-1">Finish setting up</h1>
          <p className="text-xs text-gray-500 mb-6">
            Your account is ready — just create your booking page.
          </p>

          <input
            type="text"
            value={recoverName}
            onChange={(e) => setRecoverName(e.target.value)}
            placeholder="Business name"
            className="w-full p-3 mb-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400"
          />

          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden mb-3">
            <span className="px-3 py-3 bg-gray-50 text-sm text-gray-400 border-r border-gray-200">
              trim.com/
            </span>
            <input
              type="text"
              value={recoverSlug}
              onChange={(e) => handleRecoverSlugChange(e.target.value)}
              placeholder="your-name"
              className="flex-1 p-3 text-sm text-gray-900 placeholder-gray-400 outline-none"
            />
          </div>

          {recoverError && <p className="text-xs text-red-500 mb-3">{recoverError}</p>}

          <button
            onClick={handleRecoverBusiness}
            disabled={!recoverName || !recoverSlug || recovering}
            className={`w-full py-3 text-sm font-medium rounded-lg ${
              !recoverName || !recoverSlug || recovering
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-700"
            }`}
          >
            {recovering ? "Creating..." : "Create my page"}
          </button>

          <button
            onClick={handleLogout}
            className="w-full text-xs text-gray-400 hover:text-gray-600 mt-4"
          >
            Log out
          </button>
        </div>
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

        {/* WORKING HOURS */}
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">Working hours</p>
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8">
          <p className="text-xs font-medium text-gray-700 mb-3">Days you work</p>
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { num: 1, label: "Mon" },
              { num: 2, label: "Tue" },
              { num: 3, label: "Wed" },
              { num: 4, label: "Thu" },
              { num: 5, label: "Fri" },
              { num: 6, label: "Sat" },
              { num: 0, label: "Sun" },
            ].map((day) => (
              <button
                key={day.num}
                onClick={() => toggleWorkingDay(day.num)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium ${
                  workingDays.includes(day.num)
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          <p className="text-xs font-medium text-gray-700 mb-3">Hours</p>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="flex-1 p-2.5 border border-gray-200 rounded-lg text-sm text-gray-900"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="flex-1 p-2.5 border border-gray-200 rounded-lg text-sm text-gray-900"
            />
          </div>

          <button
            onClick={handleSaveHours}
            disabled={savingHours || workingDays.length === 0}
            className={`w-full py-2.5 text-sm font-medium rounded-lg ${
              savingHours || workingDays.length === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-700"
            }`}
          >
            {savingHours ? "Saving..." : "Save hours"}
          </button>
          {hoursMessage && (
            <p className="text-xs text-gray-500 mt-2 text-center">{hoursMessage}</p>
          )}
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