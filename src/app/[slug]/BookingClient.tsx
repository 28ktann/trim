"use client"

import { useState } from "react"
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
}

export default function BookingClient({
  business,
  services,
}: {
  business: Business
  services: Service[]
}) {
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")

  const timeSlots = ["09:30", "10:00", "11:00", "13:00", "14:30", "15:00", "16:30", "17:00"]

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
    if (!chosenService || !selectedTime) return ""

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const [hours, minutes] = selectedTime.split(":")
    tomorrow.setHours(Number(hours), Number(minutes), 0, 0)

    const endTime = new Date(tomorrow.getTime() + chosenService.duration_minutes * 60000)

    // Format dates as YYYYMMDDTHHmmssZ (UTC)
    const formatDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

    const start = formatDate(tomorrow)
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
    if (!chosenService || !selectedTime) return

    setSaving(true)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const [hours, minutes] = selectedTime.split(":")
    tomorrow.setHours(Number(hours), Number(minutes), 0, 0)

    const { error } = await supabase.from("bookings").insert({
      business_id: chosenService.business_id,
      service_id: chosenService.id,
      customer_name: name,
      customer_phone: "+44" + cleanedPhone,
      booking_time: tomorrow.toISOString(),
    })

    setSaving(false)

    if (error) {
      console.error("Error saving booking:", error)
      alert("Something went wrong. Please try again.")
    } else {
      setConfirmed(true)
    }
  }

  if (confirmed && chosenService) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-xl">✓</span>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-1">You're booked!</h2>
          <p className="text-sm text-gray-500 mb-6">A confirmation has been sent to your phone.</p>
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
              <span className="text-gray-500">Time</span>
              <span className="font-medium text-gray-900">Tomorrow, {selectedTime}</span>
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
              <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">
                Pick a time · tomorrow
              </p>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2.5 rounded-lg border text-sm font-medium ${
                      selectedTime === time
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
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
                  : `Confirm — ${chosenService?.name}, ${selectedTime} · £${chosenService?.price}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}