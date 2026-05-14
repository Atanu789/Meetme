"use client"
import React, { useEffect, useState } from 'react'

export default function FileShare({
  meetingId,
  className,
}: {
  meetingId: string
  className?: string
}) {
  const [files, setFiles] = useState<Array<{ name: string; path: string }>>([])
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const fetchFiles = async () => {
    if (!meetingId) return
    try {
      const res = await fetch(`/api/files/list?meetingId=${encodeURIComponent(meetingId)}`)
      const data = await res.json()
      setFiles(data.files || [])

      const urlPairs = await Promise.all(
        (data.files || []).map(async (f: { path: string }) => {
          try {
            const r = await fetch(`/api/files/url?path=${encodeURIComponent(f.path)}`)
            if (!r.ok) return [f.path, ''] as const
            const body = await r.json()
            return [f.path, body.url || ''] as const
          } catch {
            return [f.path, ''] as const
          }
        })
      )

      setDownloadUrls(Object.fromEntries(urlPairs))
    } catch (err) {
      console.error('fetchFiles', err)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [meetingId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelected(e.target.files[0])
  }

  const handleUpload = async () => {
    if (!selected || !meetingId) {
      console.verbose('[FileShare] Missing selected or meetingId', { selected, meetingId })
      alert('No file selected or meeting ID missing')
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('meetingId', meetingId)
    formData.append('file', selected)

    console.log('[FileShare] Uploading file:', {
      meetingId,
      fileName: selected.name,
      fileSize: selected.size,
      fileType: selected.type,
    })

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('[FileShare] Upload response status:', res.status)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const errorMsg = body.error || `HTTP ${res.status}`
        console.error('[FileShare] Upload failed:', errorMsg, body)
        alert('Upload failed: ' + errorMsg)
      } else {
        const body = await res.json().catch(() => ({}))
        console.log('[FileShare] Upload successful:', body)
        setSelected(null)
        await fetchFiles()
      }
    } catch (err) {
      console.error('[FileShare] Upload error:', err)
      alert('Upload error: ' + String(err))
    }
    setUploading(false)
  }

  const handleDelete = async (path: string) => {
    const res = await fetch('/api/files/delete', {
      method: 'DELETE',
      body: JSON.stringify({ path }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (res.ok) fetchFiles()
    else alert('Delete failed')
  }

  return (
    <div className={className || 'p-2 border rounded bg-white/80'}>
      <div className="mb-2 font-medium">Meeting Files</div>
      <div className="flex gap-2 items-center mb-3">
        <input type="file" onChange={handleChange} />
        <button onClick={handleUpload} disabled={!selected || uploading} className="px-3 py-1 bg-sky-600 text-white rounded">
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      <ul className="space-y-2">
        {files.map((f) => (
          <li key={f.path} className="flex items-center justify-between">
            <a href={downloadUrls[f.path] || '#'} target="_blank" rel="noreferrer" className="text-sm text-sky-600 underline">
              {f.name.split('/').pop()}
            </a>
            <button onClick={() => handleDelete(f.path)} className="text-red-600 text-sm">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
