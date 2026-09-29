import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSettings } from '../services/settingsApi'
import { useInitialData } from '../ssr/InitialDataContext'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const preloaded = useInitialData().settings
  const [settings, setSettings] = useState(preloaded || null)
  const [loading, setLoading] = useState(!preloaded)

  async function refresh() {
    const data = await getSettings()
    setSettings(data)
    return data
  }

  useEffect(() => {
    if (preloaded) {
      return
    }
    refresh()
      .catch(() => setSettings(null))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(
    () => ({
      settings,
      loading,
      refresh,
      setSettings,
    }),
    [settings, loading],
  )

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used inside SettingsProvider')
  }
  return context
}
