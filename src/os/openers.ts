'use client'

import { useEffect, useState } from 'react'
import { useOS } from './store'

const pendingProps: Record<string, Record<string, unknown>> = {}

export function openAppByKeyWithProps(appKey: string, props: Record<string, unknown>) {
  pendingProps[appKey] = props
  useOS.getState().openAppByKey(appKey)
}

export function useLaunchProps<T>(appKey: string): T | null {
  const [props, setProps] = useState<T | null>(() => (pendingProps[appKey] as T) || null)

  useEffect(() => {
    const p = pendingProps[appKey] as T | undefined
    if (p) {
      setProps(p)
      delete pendingProps[appKey]
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return props
}