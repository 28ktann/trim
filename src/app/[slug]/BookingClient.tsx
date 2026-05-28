"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

type Service = {
  id: string
  name: string
  duration_minutes: number
  price: number
  business_id: string
}

type Business = {
  id: string
  name: string
  address: string
  slug: string
  working_days: number[]
  open_time: string
  close_time: string
}

export default function BookingClient({
  business,
  services,
}: {
  business: Business
  services: Service[]
}) {
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [takenSlots, setTakenSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")

  function generateTimeSlots(open: string, close: string): string[] {
    const slots: string[] = []
    const [openH, openM] = open.split(":").map(Number)
    const [closeH, closeM] = close.split(":").map(Number)
    const start = openH * 60 + openM
    const end = closeH * 60 + closeM
    for (let mins = start; mins < end; mins += 30) {
      const h = Math.floor(mins / 60).toString().padStart(2, "0")
      const m = (mins % 60).toString().padStart(2, "0")
      slots.push(`${h}:${m}`)
    }
    return slots
  }

  const timeSlots = generateTimeSlots(
    business.open_time.slice(0, 5),
    business.close_time.slice(0, 5)
  )

  const availableDates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    d.setHours(0, 0, 0, 0)
    return d
  }).filter((d) => business.working_days.includes(d.getDay()))

  const formatDayLabel = (d: Date) =>
    d.toLocaleDateString("en-GB", { weekday: "short" })
  const formatDateNum = (d: Date) => d.getDate().toString()
  const formatFullDate = (d: Date) =>
    d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })
  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()

  useEffect(() => {
    async function loadTakenSlots() {
      if (!selectedDate) {
        setTakenSlots([])
        return
      }
      setLoadingSlots(true)

      const dayStart = new Date(selectedDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(selectedDate)
      dayEnd.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from("bookings")
        .select("booking_time")
        .eq("business_id", business.id)
        .gte("booking_time", dayStart.toISOString())
        .lte("booking_time", dayEnd.toISOString())

      if (error) {
        console.error("Error loading slots:", error)
        setLoadingSlots(false)
        return
      }

      const taken = (data ?? []).map((b) => {
        const d = new Date(b.booking_time)
        const h = d.getHours().toString().padStart(2, "0")
        const m = d.getMinutes().toString().padStart(2, "0")
        return `${h}:${m}`
      })

      setTakenSlots(taken)
      setLoadingSlots(false)
      if (selectedTime && taken.includes(selectedTime)) {
        setSelectedTime(null)
      }
    }

    loadTakenSlots()
  }, [selectedDate, business.id])

  const chosenService = services.find((s) => s.id === selectedService)

  const cleanedPhone = phone.replace(/\s/g, "")
  const isValidUKPhone = /^7\d{9}$/.test(cleanedPhone)
  const phoneEntered = phone.length > 0

  const initials = business.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  function generateICS() {
    if (!chosenService || !selectedTime || !selectedDate) return ""

    const bookingDateTime = new Date(selectedDate)
    const [hours, minutes] = selectedTime.split(":")
    bookingDateTime.setHours(Number(hours), Number(minutes), 0, 0)

    const endTime = new Date(bookingDateTime.getTime() + chosenService.duration_minutes * 60000)

    const formatDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

    const start = formatDate(bookingDateTime)
    const end = formatDate(endTime)
    const now = formatDate(new Date())

    const uid = `${Date.now()}@trim.com`

    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Trim//Booking//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${chosenService.name} at ${business.name}`,
      `DESCRIPTION:Booking for ${name} — ${chosenService.name} (£${chosenService.price})`,
      `LOCATION:${business.address ?? business.name}`,
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n")
  }

  function handleAddToCalendar() {
    const ics = generateICS()
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "appointment.ics"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function handleConfirm() {
    if (!chosenService || !selectedTime || !selectedDate) return

    setSaving(true)

    const bookingDateTime = new Date(selectedDate)
    const [hours, minutes] = selectedTime.split(":")
    bookingDateTime.setHours(Number(hours), Number(minutes), 0, 0)

    const { error } = await supabase.from("bookings").insert({
      business_id: chosenService.business_id,
      service_id: chosenService.id,
      customer_name: name,
      customer_phone: "+44" + cleanedPhone,
      booking_time: bookingDateTime.toISOString(),
    })

    setSaving(false)

    if (error) {
      console.error("Error saving booking:", error)
      alert("Something went wrong. Please try again.")
    } else {
      setConfirmed(true)
    }
  }

  if (confirmed && chosenService && selectedDate) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-xl">✓</span>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">You're booked!</h2>
          <p className="text-sm text-gray-500 mb-6">Add it to your calendar so you don't forget.</p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-900">{name}</span>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-500">Service</span>
              <span className="font-medium text-gray-900">{chosenService.name}</span>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-500">When</span>
              <span className="font-medium text-gray-900">{formatFullDate(selectedDate)}, {selectedTime}</span>
            </div>
            <div className="flex justify-between py-1 text-sm border-t border-gray-200 mt-2 pt-2">
              <span className="text-gray-500">Total</span>
              <span className="font-medium text-gray-900">£{chosenService.price}</span>
            </div>
          </div>

          <button
            onClick={handleAddToCalendar}
            className="w-full mt-4 py-3 text-sm font-medium rounded-lg border border-gray-200 text-gray-900 hover:bg-gray-50"
          >
            Add to calendar
          </button>

          <p className="text-xs text-gray-400 mt-2">
            We'll remind you 1 day before.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl overflow-hidden">

        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-medium text-sm">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{business.name}</p>
            <p className="text-xs text-gray-500">{business.address}</p>
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">Choose service</p>
          <div className="flex flex-col gap-2">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                className={`flex justify-between items-center p-3 rounded-lg border text-left ${
                  selectedService === service.id
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{service.name}</p>
                  <p className="text-xs text-gray-500">{service.duration_minutes} min</p>
                </div>
                <p className="text-sm font-medium text-gray-900">£{service.price}</p>
              </button>
            ))}
          </div>

          {selectedService && (
            <div className="mt-6">
              <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">Pick a day</p>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {availableDates.map((date) => {
                  const isSelected = selectedDate && isSameDay(date, selectedDate)
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-14 py-2 rounded-lg border ${
                        isSelected
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 text-gray-900 hover:border-gray-300"
                      }`}
                    >
                      <span className={`text-[10px] uppercase tracking-wide ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                        {formatDayLabel(date)}
                      </span>
                      <span className="text-sm font-medium">{formatDateNum(date)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {selectedDate && (
            <div className="mt-6">
              <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">Pick a time</p>
              {loadingSlots ? (
                <p className="text-xs text-gray-400">Loading available times...</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((time) => {
                    const isTaken = takenSlots.includes(time)
                    return (
                      <button
                        key={time}
                        onClick={() => !isTaken && setSelectedTime(time)}
                        disabled={isTaken}
                        className={`py-2.5 rounded-lg border text-sm font-medium ${
                          isTaken
                            ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                            : selectedTime === time
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-200 text-gray-900 hover:border-gray-300"
                        }`}
                      >
                        {time}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {selectedTime && (
            <div className="mt-6">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full p-3 mb-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400"
              />
              <div className={`flex items-center border rounded-lg overflow-hidden mb-1 ${
                phoneEntered && !isValidUKPhone ? "border-red-400" : "border-gray-200"
              }`}>
                <span className="px-3 py-3 bg-gray-50 text-sm text-gray-500 border-r border-gray-200">
                  +44
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="7700 900123"
                  className="flex-1 p-3 text-sm text-gray-900 placeholder-gray-400 outline-none"
                />
              </div>
              {phoneEntered && !isValidUKPhone && (
                <p className="text-xs text-red-500 mb-2">
                  Enter a valid UK mobile number (e.g. 7700 900123)
                </p>
              )}
              <button
                onClick={handleConfirm}
                disabled={!name || !isValidUKPhone || saving}
                className={`w-full mt-3 py-3 text-sm font-medium rounded-lg ${
                  !name || !isValidUKPhone || saving
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-gray-700"
                }`}
              >
                {saving
                  ? "Saving..."
                  : `Confirm — ${chosenService?.name} · £${chosenService?.price}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}