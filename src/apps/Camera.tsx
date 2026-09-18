'use client'

import { useEffect, useRef, useState } from 'react'
import { useOS } from '@/os/store'
import { createFolderRemote, createFileRemote } from '@/os/fs'

export default function CameraApp() {
  const toast = useOS((s) => s.toast)
  const alert = useOS((s) => s.alert)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('getUserMedia is not supported in this browser.')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setReady(true)
        }
      } catch (e: any) {
        setError(`Could not access camera: ${e?.message || e}`)
      }
    }
    void start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const capture = async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/png')
    const name = `photo-${Date.now()}.png`

    const a = document.createElement('a')
    a.href = dataUrl
    a.download = name
    a.click()

    try {
      await createFolderRemote('/', 'Pictures').catch(() => {})
      await createFileRemote('/Pictures', name, dataUrl)
      toast('Camera', 'Photo captured and saved to /Pictures.', 'bi-camera', '#7db7ff')
    } catch (e: any) {
      alert('Camera', `Saved locally but failed to upload: ${e.message}`, 'bi-exclamation-circle')
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-[var(--window-fg)] p-3">
      {error ? (
        <div className="text-center text-red-500 p-6 bg-red-500/10 rounded-2xl">
          <i className="bi-camera-video-off text-4xl mb-2" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="relative w-full max-w-full rounded-2xl overflow-hidden bg-black aspect-video max-h-72 flex items-center justify-center">
            {!ready && (
              <p className="text-white text-sm opacity-70">
                <i className="bi-arrow-repeat animate-spin mr-2" />
                Starting camera...
              </p>
            )}
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" style={{ transform: 'rotateY(180deg)' }} />
          </div>
          <button
            onClick={() => void capture()}
            disabled={!ready}
            className="flex items-center gap-3 px-8 py-3 rounded-full bg-white/85 text-black font-semibold shadow-lg hover:bg-white disabled:opacity-40 transition-all"
          >
            <i className="bi-camera-fill text-xl" />
            Capture
          </button>
          <p className="text-xs opacity-60">Photos are saved to /Pictures and downloaded automatically.</p>
        </>
      )}
    </div>
  )
}