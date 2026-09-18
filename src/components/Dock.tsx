'use client'

import { APP_MANIFEST, SYSTEM_APPS } from '@/os/apps'
import { useOS } from '@/os/store'

export default function Dock() {
  const user = useOS((s) => s.user)
  const openAppByKey = useOS((s) => s.openAppByKey)
  const dockHidden = useOS((s) => s.dockHidden)
  const setDockHidden = useOS((s) => s.setDockHidden)

  const installed = user?.installedApps || []
  const apps = APP_MANIFEST.filter((a) => !a.system && installed.includes(a.key))
  const system = SYSTEM_APPS.filter((a) => a.key === 'taskmanager' || a.key === 'store' || a.key === 'settings')

  const iconCls =
    'icon bg-[var(--panel-bg)] text-[var(--dock-icon-color)] hover:scale-[1.1] backdrop-blur-md transition-all duration-200 w-12 h-12 flex items-center justify-center rounded-full shadow-[0px_0px_7px_#1114] cursor-pointer'

  return (
    <>
      {dockHidden && (
        <div
          className="w-1/4 max-w-[600px] h-[12px] bg-[var(--panel-bg)] fixed bottom-[7px] left-1/2 -translate-x-1/2 rounded-full cursor-pointer hover:w-[30%] hover:max-w-[800px] hover:-translate-y-1 hover:bg-[var(--surface-bg)] transition-all duration-300 z-[99998] shadow-[0px_0px_15px_#1113]"
          onClick={() => setDockHidden(false)}
          title="Show dock"
        />
      )}
      <div
        className={`os-dock-wrap w-fit fixed bottom-2 left-1/2 -translate-x-1/2 space-x-2 flex z-[99998] transition-transform duration-[350ms] ease-[cubic-bezier(.2,.8,.2,1)] ${
          dockHidden ? 'translate-y-[120px]' : 'translate-y-0'
        }`}
      >
        <div className="w-fit px-3 h-[70px] transition-all duration-300 mx-auto bottom-2 rounded-full flex justify-center items-center flex-row space-x-3 z-[9998] shadow-[0px_0px_20px_#1113] backdrop-blur-md bg-[var(--panel-bg)]">
          {apps.map((app) => (
            <button key={app.key} className={iconCls} title={app.name} onClick={() => openAppByKey(app.key)}>
              <i className={`${app.icon} text-2xl`} />
            </button>
          ))}
        </div>

        <div className="w-fit px-3 h-[70px] transition-all duration-300 mx-auto bottom-2 rounded-full flex justify-center items-center flex-row space-x-3 z-[9998] shadow-[0px_0px_20px_#1113] backdrop-blur-md bg-[var(--panel-bg)]">
          {system.map((app) => (
            <button key={app.key} className={iconCls} title={app.name} onClick={() => openAppByKey(app.key)}>
              <i className={`${app.icon} text-2xl`} />
            </button>
          ))}
        </div>
      </div>
    </>
  )
}