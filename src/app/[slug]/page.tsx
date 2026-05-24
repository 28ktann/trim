import { supabase } from "@/lib/supabase"
import BookingClient from "./BookingClient"

export default async function BusinessPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error || !business) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Business not found</p>
      </main>
    )
  }

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("price", { ascending: true })

  return (
    <BookingClient business={business} services={services ?? []} />
  )
}