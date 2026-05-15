export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">

      <p className="text-xs tracking-widest text-gray-400 uppercase mb-4">
        Trim
      </p>

      <h1 className="text-4xl font-medium text-gray-900 tracking-tight mb-3 text-center">
        Bookings, simplified.
      </h1>

      <p className="text-base text-gray-500 max-w-sm text-center leading-relaxed mb-8">
        A booking system built for independent barbers. No commissions. No middlemen.
      </p>

      <div className="flex gap-3 mb-16">
        <button className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700">
          See it in action
        </button>
        <button className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
          Barber dashboard
        </button>
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