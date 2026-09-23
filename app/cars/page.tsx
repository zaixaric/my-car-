'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'

type Vehicle = {
  id: string
  brand: string
  model: string
  category: string
  transmission: string
  fuel_type: string
  seating_capacity: number
  monthly_price: number
  deposit_amount: number
  image_urls: string[]
}

export default function CarsPage() {
  const supabase = createClient()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase.from('vehicles').select('*').eq('status', 'available')

      if (category !== 'all') {
        query = query.eq('category', category)
      }

      const { data } = await query.order('monthly_price', { ascending: true })
      setVehicles(data || [])
      setLoading(false)
    }
    load()
  }, [category])

  return (
    <div className="min-h-screen bg-[#0B0F1A] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-1">Browse Cars</h1>
        <p className="text-white/40 text-sm mb-6">
          Monthly rentals across Dubai, delivered or picked up.
        </p>

        {/* Filter bar */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['all', 'Sedan', 'SUV'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium border transition-colors ${
                category === cat
                  ? 'bg-[#1B5E3D] border-[#1B5E3D] text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
              }`}
            >
              {cat === 'all' ? 'All Cars' : cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-white/40 text-center py-20">Loading cars...</p>
        ) : vehicles.length === 0 ? (
          <p className="text-white/40 text-center py-20">No cars found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="bg-[#12172A] border border-white/10 rounded-2xl overflow-hidden hover:border-[#1B5E3D] transition-colors"
              >
                <div className="aspect-[16/10] bg-white/5 overflow-hidden">
                  {v.image_urls?.[0] && (
                    <img
                      src={v.image_urls[0]}
                      alt={`${v.brand} ${v.model}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-semibold">
                        {v.brand} {v.model}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {v.category} · {v.transmission} · {v.seating_capacity} seats
                      </p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-[#C9A24B] text-lg font-bold">
                        AED {v.monthly_price.toLocaleString()}
                        <span className="text-white/40 text-xs font-normal">/mo</span>
                      </p>
                      <p className="text-white/30 text-xs">
                        Deposit: AED {v.deposit_amount.toLocaleString()}
                      </p>
                    </div>
                    <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-lg px-4 py-2.5 min-h-[44px] transition-colors">
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}