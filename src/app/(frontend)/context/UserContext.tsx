'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  name?: string
  firstName?: string
  lastName?: string
  phone?: string
  gender?: string
  role?: string
  profileImage?: {
    url?: string
    alt?: string
  }
}

interface UserContextType {
  user: User | null
  loading: boolean
  login: (userData: User) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session (e.g., via cookies or API)
    fetch('/api/users/me')
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error('Not authenticated')
      })
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = (userData: User) => setUser(userData)
  const logout = () => {
    setUser(null)
    document.cookie = 'payload-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
  }

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/users/me')
      const data = await res.json()
      if (data.user) setUser(data.user)
    } catch (e) {
      console.error('Refresh user failed', e)
    }
  }

  return (
    <UserContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used within a UserProvider')
  return context
}
