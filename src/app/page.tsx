import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">

      <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">
        Trim
      </p>

      <h1 className="text-4xl font-medium text-gray-900 tracking-tight mb-3 text-center">
        Your booking page,<br />ready in 60 seconds.
      </h1>

      <p className="text-base text-gray-500 max-w-sm text-center leading-relaxed mb-8">
        A beautiful booking page built for independent nail & lash techs. Flat fee. No commissions.
      </p>

      <div className="flex gap-3 mb-16">
        <Link
          href="/pricing"
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700"
        >
          View pricing
        </Link>
        <Link
          href="/cosmos"
          className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
        >
          See a demo
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-2xl w-full">

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-900">Instant SMS alerts</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Know the moment a customer books — straight to your phone.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-900">Block any day</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Off sick? On holiday? Tap once — bookings stop.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-900">Keep your earnings</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Flat monthly fee. No per-booking commission, ever.
          </p>
        </div>

      </div>

    </main>
  )
}