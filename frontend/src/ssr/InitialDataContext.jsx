import { createContext, useContext, useEffect, useState } from 'react'

// Data the server already fetched for this page. Components start from it
// so the first browser render matches the server HTML.
const InitialDataContext = createContext({})

// Cleared after the first render, so components mounted later (after client
// navigation) fetch fresh data instead of reusing the page-load snapshot.
export function InitialDataProvider({ value, children }) {
  const [data, setData] = useState(value || {})

  useEffect(() => {
    setData({})
  }, [])

  return (
    <InitialDataContext.Provider value={data}>{children}</InitialDataContext.Provider>
  )
}

export function useInitialData() {
  return useContext(InitialDataContext)
}
