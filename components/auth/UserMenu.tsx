'use client'

import { useEffect, useState } from 'react'
import LogoutButton from './LogoutButton'

interface User {
  email: string
  name?: string
  role: string
}

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  async function fetchUser() {
    try {
      const response = await fetch('/api/auth/user')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    technician: 'Técnico',
    manager: 'Gerente',
    client: 'Cliente',
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
        <p className="text-xs text-gray-500">{roleLabels[user.role] || user.role}</p>
      </div>
      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
        <span className="text-white text-sm font-semibold">
          {(user.name || user.email).charAt(0).toUpperCase()}
        </span>
      </div>
      <LogoutButton />
    </div>
  )
}
