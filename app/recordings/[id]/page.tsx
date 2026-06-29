'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import TaskList from '@/components/TaskList'
import ParticipationAnalytics from '@/components/ParticipationAnalytics'
import FileShare from '@/components/FileShare'

type MeetingData = {
  _id: string
  meetingId: string
  title: string
  description?: string
  summary?: string
  keyNotes?: string[]
  keyDecisions?: string[]
  actionItems?: any[]
  transcript?: Array<{ text: string; timestamp: number; speaker?: string }>
  speakerLabels?: any[]
}

export default function RecordingPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [meeting, setMeeting] = useState<MeetingData | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const mResp = await fetch(`/api/get-meeting?id=${encodeURIComponent(id)}`)
        if (!mResp.ok) {
          router.push('/')
          return
        }
        const mBody = await mResp.json()
        setMeeting(mBody.meeting || null)

        const tResp = await fetch(`/api/tasks/meeting/${encodeURIComponent(id)}`)
        if (tResp.ok) {
          const tBody = await tResp.json()
          setTasks(tBody.tasks || [])
        }
      } catch (err) {
        console.error('fetch recording page', err)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchAll()
  }, [id, router])

  if (loading) return <div className="p-6">Loading recording…</div>
  if (!meeting) return <div className="p-6 text-red-600">Recording not found.</div>

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-2">Recording: {meeting.title || meeting.meetingId}</h1>
      <p className="text-sm text-slate-600 mb-4">{meeting.description}</p>

      <section className="mb-6">
        <h2 className="text-lg font-medium">Summary</h2>
        <div className="mt-2 p-3 bg-white/70 rounded">{meeting.summary || 'No summary available.'}</div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium">Key Notes</h2>
        <ul className="mt-2 list-disc pl-5">
          {(meeting.keyNotes || []).length === 0 && <li className="text-sm text-slate-500">No key notes recorded.</li>}
          {(meeting.keyNotes || []).map((note, idx) => <li key={idx}>{note}</li>)}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium">Key Decisions</h2>
        <ul className="mt-2 list-disc pl-5">
          {(meeting.keyDecisions || []).length === 0 && <li className="text-sm text-slate-500">No decisions recorded.</li>}
          {(meeting.keyDecisions || []).map((d, idx) => <li key={idx}>{d}</li>)}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium">Action Items</h2>
        <ul className="mt-2 list-disc pl-5">
          {(meeting.actionItems || []).length === 0 && <li className="text-sm text-slate-500">No action items.</li>}
          {(meeting.actionItems || []).map((a: any, i: number) => (
            <li key={i} className="mb-2">
              <div className="font-medium">{typeof a === 'string' ? a : a.item || JSON.stringify(a)}</div>
              <div className="text-xs text-slate-500">{(a && a.owner) || 'Unassigned'}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium">Tasks</h2>
        <div className="mt-2">
          <TaskList meetingId={meeting.meetingId} />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium">Transcript</h2>
        <div className="mt-2 space-y-2">
          {(meeting.transcript || []).length === 0 && <div className="text-sm text-slate-500">No transcript available.</div>}
          {(meeting.transcript || []).map((t, i) => (
            <div key={i} className="p-2 bg-white/60 rounded">
              <div className="text-sm text-slate-700">{t.speaker ? <strong>{t.speaker}: </strong> : null}{t.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium">Participation</h2>
        <div className="mt-2">
          <ParticipationAnalytics meetingId={meeting.meetingId} />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium">Files</h2>
        <div className="mt-2">
          <FileShare meetingId={meeting.meetingId} />
        </div>
      </section>
    </div>
  )
}
