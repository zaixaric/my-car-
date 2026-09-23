'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'

type DocType = 'emirates_id' | 'driving_license' | 'passport'

const DOC_LABELS: Record<DocType, string> = {
  emirates_id: 'Emirates ID',
  driving_license: 'Driving License',
  passport: 'Passport',
}

type DocRecord = {
  document_type: DocType
  status: string
}

export default function KycPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [docs, setDocs] = useState<Record<string, DocRecord>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('documents')
        .select('document_type, status')
        .eq('customer_id', user.id)

      if (data) {
        const map: Record<string, DocRecord> = {}
        data.forEach((d) => { map[d.document_type] = d })
        setDocs(map)
      }
    }
    load()
  }, [])

  async function handleUpload(docType: DocType, file: File) {
    if (!userId) {
      setMessage('Please log in first.')
      return
    }
    setUploading(docType)
    setMessage('')

    const filePath = `${userId}/${docType}-${Date.now()}.${file.name.split('.').pop()}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) {
      setMessage(`Upload failed: ${uploadError.message}`)
      setUploading(null)
      return
    }

    const { error: dbError } = await supabase.from('documents').insert({
      customer_id: userId,
      document_type: docType,
      file_url: filePath,
      status: 'pending',
    })

    if (dbError) {
      setMessage(`Save failed: ${dbError.message}`)
    } else {
      setDocs((prev) => ({
        ...prev,
        [docType]: { document_type: docType, status: 'pending' },
      }))
      setMessage(`${DOC_LABELS[docType]} uploaded successfully!`)
    }

    setUploading(null)
  }

  function statusBadge(status?: string) {
    if (!status) return null
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      rejected: 'bg-red-500/10 text-red-500 border-red-500/30',
    }
    return (
      <span className={`text-xs px-2.5 py-1 rounded-full border ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const docTypes: DocType[] = ['emirates_id', 'driving_license', 'passport']

  return (
    <div className="min-h-screen bg-[#0B0F1A] px-4 py-10">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-1">Identity Verification</h1>
        <p className="text-white/40 text-sm mb-8">
          Upload your documents to complete KYC and start renting.
        </p>

        {message && (
          <div className="mb-4 text-sm text-white/80 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            {message}
          </div>
        )}

        <div className="space-y-4">
          {docTypes.map((docType) => {
            const doc = docs[docType]
            return (
              <div
                key={docType}
                className="bg-[#12172A] border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-white font-medium">{DOC_LABELS[docType]}</p>
                  <div className="mt-1.5">
                    {doc ? statusBadge(doc.status) : (
                      <span className="text-xs text-white/30">Not uploaded</span>
                    )}
                  </div>
                </div>

                <label className="shrink-0 cursor-pointer bg-[#1B5E3D] hover:bg-[#236f49] text-white text-sm font-medium rounded-lg px-4 py-2.5 min-h-[44px] flex items-center transition-colors">
                  {uploading === docType ? 'Uploading...' : doc ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    disabled={uploading === docType}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(docType, file)
                    }}
                  />
                </label>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}