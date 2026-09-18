'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOS } from '@/os/store'
import { getAppManifest, installedAppKeys } from '@/os/apps'
import { loadThemeData, applyScheme, applyThemeScheme, setUserTheme } from '@/os/theming'
import type { ThemeData } from '@/os/types'

type Page = 'home' | 'theme' | 'apps' | 'appearance' | 'notifications' | 'about' | 'developer' | 'account'

export default function SettingsApp() {
  const user = useOS((s) => s.user)
  const openAppByKey = useOS((s) => s.openAppByKey)
  const toast = useOS((s) => s.toast)
  const alert = useOS((s) => s.alert)
  const notify = useOS((s) => s.notify)
  const [page, setPage] = useState<Page>('home')
  const [themes, setThemes] = useState<{ name: string; author: string; file: string }[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [themeDetail, setThemeDetail] = useState<ThemeData | null>(null)
  const [installed, setInstalled] = useState<string[]>(user?.installedApps || [])

  useEffect(() => {
    fetch('/api/themes')
      .then((r) => r.json())
      .then((d) => setThemes(d.themes || []))
      .catch(() => {})
  }, [])

  const pickAppInstance = useCallback((key: string) => {
    // non-system apps open once; focus the existing window via store
    openAppByKey(key)
  }, [openAppByKey])

  const selectTheme = async (file: string) => {
    const data = await loadThemeData(file)
    if (data) {
      setSelected(file)
      setThemeDetail(data)
      const schemeSel = useOS.getState().schemeName
      const name = data.schemes[schemeSel] ? schemeSel : data.defaultScheme || Object.keys(data.schemes)[0]
      await applyScheme(data.schemes[name])
      setUserTheme(file)
      useOS.getState().setThemeData(data, name)
      toast('Settings', 'Theme changed.', 'bi-check-circle', '#0f0')
    }
  }

  const toggleScheme = useCallback(() => {
    useOS.getState().toggleScheme()
  }, [])

  const appList = installedAppKeys(installed)

  const back = (p: Page) => setPage(p)

  return (
    <div className="h-full flex flex-col text-[var(--window-fg)]">
      {page === 'home' && (
        <div className="h-full p-4 overflow-auto">
          <div className="flex items-center">
            <p className="font-bold text-4xl">Settings</p>
            <button
              onClick={() => setPage('account')}
              className="flex items-center gap-2 ml-auto rounded-full border-2 border-[var(--window-fg)] px-5 py-1 hover:bg-[var(--window-fg)] hover:text-[var(--window-bg)] transition-all"
            >
              <i className="bi-person-fill text-lg" />
              {user?.username}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            {(
              [
                { icon: 'bi-window', label: 'Apps', page: 'apps' as const },
                { icon: 'bi-sliders', label: 'Appearance & Behavior', page: 'appearance' as const },
                { icon: 'bi-palette', label: 'Theme', page: 'theme' as const },
                { icon: 'bi-bell', label: 'Notifications', page: 'notifications' as const },
                { icon: 'bi-chat-left-text', label: 'Feedback', page: 'feedback' as const },
                { icon: 'bi-info-circle', label: 'About browserOS', page: 'about' as const },
              ] as { icon: string; label: string; page: Page | 'feedback' }[]
            ).map((tile) => (
              <button
                key={tile.page}
                onClick={() => (tile.page === 'feedback' ? void openAppByKey('settings') : setPage(tile.page))}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[var(--surface-bg)] active:bg-[var(--surface-active)] transition-colors text-left"
              >
                <i className={`${tile.icon} text-4xl opacity-80`} />
                <p className="text-lg font-medium">{tile.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {page === 'apps' && (
        <div className="h-full p-4 flex flex-col overflow-hidden">
          <Back label="Apps" onBack={() => back('home')} title={<><i className="bi-window mr-2" /> Apps</>} />
          <div className="mt-3 mb-3 flex items-center gap-2">
            <button onClick={() => openAppByKey('store')} className="px-4 py-2 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] text-sm font-semibold">
              <i className="bi-shop-window mr-1" />
              Open Store
            </button>
            <p className="text-xs opacity-50 ml-auto">{appList.length} installed</p>
          </div>
          <div className="os-scroll flex-1 overflow-auto divide-y divide-[var(--dock-icon-color)]/15 rounded-2xl">
            {appList.map((key) => {
              const app = getAppManifest(key)
              if (!app) return null
              return (
                <button key={key} onClick={() => pickAppInstance(key)} className="w-full flex items-center p-3 hover:bg-[var(--surface-bg)] transition-colors text-left">
                  <p>
                    <i className={`mr-3 ${app.icon}`} />
                    {app.name}
                  </p>
                  <i className="bi-chevron-right text-sm ml-auto opacity-50" />
                </button>
              )
            })}
            {appList.length === 0 && <p className="p-6 text-center opacity-50">No user apps installed.</p>}
          </div>
        </div>
      )}

      {page === 'appearance' && (
        <div className="h-full p-4 overflow-auto">
          <Back label="Appearance" onBack={() => back('home')} title={<><i className="bi-sliders mr-2" /> Appearance</>} />
          <div className="mt-5 flex items-center">
            <p className="text-lg"><i className="bi-brightness-high mr-2" />Color scheme ({useOS.getState().schemeName})</p>
            <button onClick={toggleScheme} className="ml-auto px-5 py-2 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] text-sm font-semibold">
              Toggle scheme
            </button>
          </div>
          <div className="mt-4 flex items-center">
            <p className="text-lg"><i className="bi-window-dock mr-2" /> Transparent top bar</p>
            <div className="ml-auto">
              <Toggle
                initial={useOS.getState().settings.transparentTopbar}
                onToggle={(v) => useOS.getState().setSetting('transparentTopbar', v)}
              />
            </div>
          </div>
        </div>
      )}

      {page === 'theme' && (
        <div className="h-full p-4 flex flex-col overflow-hidden">
          <Back label="Theme" onBack={() => back('home')} title={<><i className="bi-palette mr-2" /> Theme</>} />
          {themeDetail && selected ? (
            <ThemeDetail
              data={themeDetail}
              onBack={() => {
                setThemeDetail(null)
                setSelected(null)
              }}
              isCurrent={
                themeDetail.file === useOS.getState().themeFile
              }
              onApply={() => void selectTheme(selected)}
            />
          ) : (
            <div className="os-scroll mt-4 flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
              {themes.map((t) => (
                <button
                  key={t.file}
                  onClick={() => void selectTheme(t.file)}
                  className={`p-2 rounded-2xl hover:bg-[var(--surface-bg)] transition-all text-center ${
                    t.file === useOS.getState().themeFile ? 'bg-[var(--surface-bg)] ring-2 ring-[var(--accent)]' : ''
                  }`}
                >
                  <ThemePreview file={t.file} />
                  <p className="text-sm mt-1 font-medium">{t.name}</p>
                  <p className="text-xs opacity-50">{t.author}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {page === 'notifications' && (
        <div className="h-full p-4 overflow-auto">
          <Back label="Notifications" onBack={() => back('home')} title={<><i className="bi-bell mr-2" /> Notifications</>} />
          <div className="mt-5 flex flex-col gap-3">
            <button
              onClick={() => notify('Test Notification', 'This is how notifications will look.', 'bi-bell-fill')}
              className="px-5 py-3 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] text-left"
            >
              <i className="bi-bell mr-2" />
              Send a test notification
            </button>
            <button
              onClick={() => useOS.getState().clearNotifications()}
              className="px-5 py-3 rounded-full bg-[var(--surface-bg)] hover:bg-[var(--surface-hover)] text-left"
            >
              <i className="bi-x-circle mr-2" />
              Clear notification center
            </button>
          </div>
        </div>
      )}

      {page === 'about' && (
        <div className="h-full p-4 overflow-auto">
          <Back label="About" onBack={() => back('home')} title={<><i className="bi-info-circle mr-2" /> About browserOS</>} />
          <table className="w-full mt-5 text-lg">
            <tbody>
              <tr className="border-b border-[var(--dock-icon-color)]/20">
                <td className="p-3 w-1/2">browserOS Version</td>
                <td className="p-3 opacity-60">Next 2.0</td>
              </tr>
              <tr className="border-b border-[var(--dock-icon-color)]/20">
                <td className="p-3 w-1/2">Engine</td>
                <td className="p-3 opacity-60">React + Next.js + Tailwind</td>
              </tr>
              <tr>
                <td className="p-3 w-1/2">Storage</td>
                <td className="p-3 opacity-60">Neon Postgres</td>
              </tr>
            </tbody>
          </table>
          <button onClick={() => setPage('developer')} className="mt-4 flex items-center w-full hover:bg-white/60 p-3 rounded-2xl transition-colors">
            <p><i className="bi-code-slash mr-2" /> About the Developer</p>
            <i className="bi-chevron-right text-sm ml-auto" />
          </button>
        </div>
      )}

      {page === 'developer' && (
        <div className="h-full p-4 overflow-auto">
          <Back label="Developer" onBack={() => back('about')} title="💻 About the Dev" />
          <p className="mt-5 text-lg leading-relaxed">
            Hey there. I'm Shalom Agbongo, the guy behind this whole browserOS thing. What started as a
            bunch of HTML in a XAMPP folder became a working web operating system, and this Next.js
            version brings it to life with React windows, a Neon Postgres filesystem, and all the
            keyboard shortcuts that made the original fun. The window system? Me. The theming engine?
            Me. Still me. That one transition that looks too smooth to be JavaScript? Also me.
            Stay curious — Shalom.
          </p>
        </div>
      )}

      {page === 'account' && (
        <div className="h-full p-4 overflow-auto">
          <Back label="Account" onBack={() => back('home')} title={<><i className="bi-person mr-2" /> {user?.username}</>} />
          <table className="w-full mt-5 text-lg">
            <tbody>
              <tr className="border-b border-[var(--dock-icon-color)]/20">
                <td className="p-3 w-1/2">Name</td>
                <td className="p-3 opacity-60">{user?.username}</td>
              </tr>
              <tr className="border-b border-[var(--dock-icon-color)]/20">
                <td className="p-3 w-1/2">Identifier</td>
                <td className="p-3 opacity-60 font-mono text-sm">{user?.uh}</td>
              </tr>
            </tbody>
          </table>
          <button
            onClick={() => alert('Account', 'Changing passwords is not part of this demo. Sorry!', 'bi-info-circle')}
            className="mt-6 flex items-center w-full p-3 hover:bg-red-500/10 text-red-500 rounded-2xl transition-colors"
          >
            <p className="font-semibold"><i className="bi-trash mr-2" /> Delete Account</p>
          </button>
        </div>
      )}
    </div>
  )
}

function Back({ label, onBack, title }: { label: string; onBack: () => void; title: React.ReactNode }) {
  return (
    <>
      <button onClick={onBack} className="w-fit px-3 py-1 rounded-full hover:bg-[var(--surface-hover)] text-sm">
        <i className="bi-arrow-left mr-1" /> {label}
      </button>
      <p className="text-3xl font-bold mt-2">{title}</p>
    </>
  )
}

function Toggle({ initial, onToggle }: { initial: boolean; onToggle: (v: boolean) => void }) {
  const [on, setOn] = useState(initial)
  return (
    <div
      className={`toggle-outer ${on ? 'active' : ''}`}
      onClick={() => {
        const next = !on
        setOn(next)
        onToggle(next)
      }}
    >
      <div className="toggle-inner" />
    </div>
  )
}

function ThemePreview({ file }: { file: string }) {
  const [bg, setBg] = useState('linear-gradient(135deg, #667eea, #764ba2)')
  const [fg, setFg] = useState('#fff')
  useEffect(() => {
    void loadThemeData(file).then((d) => {
      if (!d) return
      const s = d.schemes[d.defaultScheme || Object.keys(d.schemes)[0]]
      if (s) {
        setBg(s.bg.startsWith('/') || s.bg.startsWith('http') ? `url(${s.bg}) center/cover` : s.bg)
        setFg(s.panel_fg)
      }
    })
  }, [file])
  return (
    <div className="w-full rounded-xl overflow-hidden relative" style={{ aspectRatio: '6/4', background: bg, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="h-1.5 w-3/4 mx-auto mt-2 rounded-full" style={{ background: fg }} />
      <div className="w-1/2 h-[12%] rounded-full absolute left-1/2 -translate-x-1/2 bottom-1" style={{ background: fg }} />
    </div>
  )
}

function ThemeDetail({ data, onBack, isCurrent, onApply }: { data: ThemeData; onBack: () => void; isCurrent: boolean; onApply: () => void }) {
  void applyThemeScheme
  const scheme = data.schemes[data.defaultScheme || Object.keys(data.schemes)[0]]
  return (
    <div className="mt-4">
      <button onClick={onBack} className="px-3 py-1 rounded-full hover:bg-[var(--surface-hover)] text-sm">
        <i className="bi-arrow-left mr-1" /> Back
      </button>
      <div className="flex flex-wrap gap-6 mt-4">
        <div className="flex-1 min-w-[220px] flex items-center justify-center">
          <div className="w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '6/4', background: scheme?.bg, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="h-3 w-full" style={{ background: scheme?.panel_fg }} />
            <div className="w-1/2 h-[10%] rounded-full absolute" style={{ background: scheme?.panel_fg, marginLeft: '25%', marginTop: '2%' }} />
            <div className="w-1/2 h-[12%] rounded-full mx-auto relative top-[78%]" style={{ background: scheme?.panel_fg }} />
          </div>
        </div>
        <div className="text-right ml-auto min-w-[200px] flex flex-col justify-center">
          <p className="text-3xl font-bold">{data.name}</p>
          <p className="opacity-60 text-xl">{data.author}</p>
          <p className="opacity-40 font-mono text-sm">{data.file}</p>
          <button
            onClick={onApply}
            disabled={isCurrent}
            className="mt-3 ml-auto px-6 py-2 rounded-full bg-[#77f] text-white font-semibold hover:opacity-90 disabled:opacity-40 transition"
          >
            {isCurrent ? 'Current theme' : 'Select'}
          </button>
        </div>
      </div>
    </div>
  )
}