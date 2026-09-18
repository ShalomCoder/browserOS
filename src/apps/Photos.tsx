'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useOS } from '@/os/store'
import { useLaunchProps } from '@/os/openers'
import { listDir, joinDir, IMAGE_EXTS } from '@/os/fs'

type ImageItem = { name: string; src: string }

export default function PhotosApp() {
  const launch = useLaunchProps<{ dir?: string; start?: string }>('photos')
  const toast = useOS((s) => s.toast)

  const initDir = launch?.dir || '/'
  const initName = launch?.start || null

  const [dir, setDir] = useState(initDir)
  const [index, setIndex] = useState(() => -1)
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [fit, setFit] = useState(true)
  const [slideshow, setSlideshow] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const mounted = useRef(true)

  const load = useCallback(async (dirPath: string) => {
    setLoading(true)
    try {
      const items = await listDir(dirPath)
      const list = items.filter((i) => i.type === 'file' && IMAGE_EXTS.test(i.name))
      setImages(list.map((i) => ({ name: i.name, src: `/api/fs?file=${encodeURIComponent(joinDir(dirPath, i.name))}&t=${Date.now()}` })))
      setDir(dirPath)
      const startIdx = initName ? list.findIndex((i) => i.name === initName) : 0
      setIndex(startIdx >= 0 ? startIdx : -1)
    } catch {
      setImages([])
      setIndex(-1)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    mounted.current = true
    void load(initDir)
    return () => {
      mounted.current = false
    }
  }, [initDir, load])

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [])

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        if (images.length === 0) return -1
        return ((i + delta) % images.length + images.length) % images.length
      })
    },
    [images.length]
  )

  useEffect(() => {
    if (slideshow) {
      timer.current = setInterval(() => go(1), 3000)
    } else if (timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [slideshow, go])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'Space') {
        e.preventDefault()
        setSlideshow((s) => !s)
      }
      if (e.key === '+') setZoom((z) => Math.min(5, +(z + 0.25).toFixed(2)))
      if (e.key === '-') setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  const current = index >= 0 ? images[index] : null
  const thumbnails = useMemo(() => images.slice(0, 8), [images])

  const download = () => {
    if (!current) return
    const a = document.createElement('a')
    a.href = current.src.split('&t=')[0]
    a.download = current.name
    a.click()
    toast('Photos', `Saving ${current.name}`, 'bi-download', '#7db7ff')
  }

  return (
    <div className="h-full flex flex-col text-[var(--window-fg)]">
      <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
        <p className="text-sm opacity-70 flex-1 min-w-0 truncate">
          <i className="bi-folder2-open mr-2" />
          {dir}
        </p>
        <button onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))} className="w-8 h-8 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)]" title="Zoom out">
          <i className="bi-zoom-out" />
        </button>
        <button onClick={() => setZoom((z) => Math.min(5, +(z + 0.25).toFixed(2)))} className="w-8 h-8 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)]" title="Zoom in">
          <i className="bi-zoom-in" />
        </button>
        <button
          onClick={() => {
            setFit(true)
            setZoom(1)
          }}
          className="px-3 py-1.5 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] text-xs"
          title="Fit to window"
        >
          Fit
        </button>
        <button
          onClick={() => {
            setFit(false)
            setZoom(1)
          }}
          className="px-3 py-1.5 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] text-xs"
          title="Actual size"
        >
          Actual
        </button>
        <button
          onClick={() => setSlideshow((s) => !s)}
          className={`px-3 py-1.5 rounded-full text-xs ${slideshow ? 'bg-[var(--accent-bg)] text-white' : 'bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)]'}`}
        >
          <i className={`${slideshow ? 'bi-pause-fill' : 'bi-play-fill'} mr-1`} />
          {slideshow ? 'Pause' : 'Play'}
        </button>
        <button onClick={download} className="w-8 h-8 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)]" title="Download" disabled={!current}>
          <i className="bi-download" />
        </button>
      </div>

      <div className="flex-1 relative mx-2 mb-2 rounded-xl overflow-hidden bg-black/25 flex items-center justify-center" onDoubleClick={() => { setFit(true); setZoom(1) }}>
        {loading ? (
          <p className="opacity-60">
            <i className="bi-arrow-repeat animate-spin mr-2" />
            Loading...
          </p>
        ) : current ? (
          <div className="max-w-full max-h-full overflow-hidden flex items-center justify-center">
            <img
              src={current.src}
              alt={current.name}
              className="select-none transition-transform duration-150"
              style={fit ? { maxWidth: '100%', maxHeight: '100%', transform: `scale(${zoom})` } : { transform: `scale(${zoom})` }}
              draggable={false}
            />
          </div>
        ) : (
          <div className="text-center opacity-50">
            <i className="bi-image text-5xl" />
            <p className="mt-2">No images in this folder.</p>
          </div>
        )}

        {images.length > 0 && index >= 0 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center">
              <i className="bi-chevron-left" />
            </button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center">
              <i className="bi-chevron-right" />
            </button>
          </>
        )}
      </div>

      <div className={`px-3 pb-2 flex items-center gap-1 overflow-x-auto os-hidden-scrollbar transition-opacity ${thumbnails.length ? 'opacity-100' : 'opacity-0'}`}>
        {thumbnails.map((img, i) => (
          <button key={img.name} onClick={() => setIndex(i)} className={`w-12 h-9 rounded-md overflow-hidden shrink-0 border-2 ${i === index ? 'border-[var(--accent)]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
            <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {current && (
        <p className="px-3 pb-2 text-xs opacity-60">
          {current.name} — {index + 1} / {images.length} — {zoom.toFixed(2)}x
        </p>
      )}
    </div>
  )
}