import Link from "next/link"

export default function PricingPage() {
  const features = [
    "Your own branded booking page",
    "Unlimited bookings — no per-booking fees",
    "Manage services & prices yourself",
    "Owner dashboard with revenue tracking",
    "Instant SMS alerts when a customer books",
    "Block out days off in one tap",
    "Custom link — trim.com/your-name",
    "UK support",
  ]

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-12">
          <p className="text-xs tracking-widest text-gray-400 uppercase mb-3">Pricing</p>
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight mb-3">
            One plan. Everything included.
          </h1>
          <p className="text-base text-gray-500 max-w-md mx-auto">
            No commissions. No transaction fees. Cancel anytime.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8">

          <div className="flex items-baseline gap-1 mb-1">
            <p className="text-4xl font-medium text-gray-900">£14.99</p>
            <p className="text-sm text-gray-500">/month</p>
          </div>
          <p className="text-xs text-gray-500 mb-6">Billed monthly · Cancel anytime</p>

          <Link
            href="/signup"
            className="block text-center w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 mb-6"
          >
            Get started
          </Link>

          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs font-medium text-gray-700 mb-4 tracking-wide uppercase">
              What's included
            </p>
            <ul className="flex flex-col gap-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="text-gray-900 mt-0.5">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Questions? <Link href="/" className="text-gray-700 underline">Back to home</Link>
        </p>

      </div>
    </main>
  )
}