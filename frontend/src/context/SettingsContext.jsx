import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSettings } from '../services/settingsApi'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const data = await getSettings()
    setSettings(data)
    return data
  }

  useEffect(() => {
    refresh()
      .catch(() => setSettings(null))
      .finally(() => setLoading(false))
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
