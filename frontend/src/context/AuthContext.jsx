import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getMe, login as loginRequest, logoutRequest } from '../services/authApi'
import {
  clearAuth,
  getStoredUser,
  getToken,
  saveAuth,
} from '../utils/authStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [token, setToken] = useState(() => getToken())
  const [loading, setLoading] = useState(Boolean(getToken()))

  useEffect(() => {
    async function restoreSession() {
      if (!getToken()) {
        setLoading(false)
        return
      }

      try {
        const me = await getMe()
        setUser(me)
        saveAuth(getToken(), me)
      } catch {
        clearAuth()
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  async function login(email, password) {
    const data = await loginRequest(email, password)
    saveAuth(data.access_token, data.user)
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  async function logout() {
    try {
      if (getToken()) {
        await logoutRequest()
      }
    } catch {
      // Still clear local auth even if the API call fails.
    } finally {
      clearAuth()
      setToken(null)
      setUser(null)
    }
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [user, token, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
