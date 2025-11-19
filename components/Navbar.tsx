'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Wrench,
  Package,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  AlertTriangle,
  MessageSquare
} from 'lucide-react'

interface User {
  email: string
  name?: string
  role: string
}

export default function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)

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

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Mantenciones', href: '/maintenances', icon: Wrench },
    { name: 'Órdenes de Trabajo', href: '/work-orders', icon: FileText },
    { name: 'Incidencias', href: '/admin/incidencias', icon: AlertTriangle },
    { name: 'Calendario', href: '/calendar', icon: Calendar },
    // Inventario moved to Admin dropdown
  ]

  const adminNavigation = [
    { name: 'Inventario de Equipos', href: '/admin/equipment-inventory', icon: Package },
    { name: 'Inventario de Filtros', href: '/admin/filter-inventory', icon: Package },
    { name: 'Mapeos Equipo-Filtro', href: '/admin/mappings', icon: Settings },
    { name: 'Mensajes WhatsApp', href: '/admin/whatsapp-messages', icon: MessageSquare },
    { name: 'Gestión de Usuarios', href: '/users', icon: Shield },
  ]

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    TECHNICIAN: 'Técnico',
    MANAGER: 'Gerente',
    CLIENT: 'Cliente',
  }

  // Show skeleton while loading, hide if not authenticated
  if (!user) {
    if (loading) {
      return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="h-12 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </nav>
      )
    }
    return null // Not authenticated and not loading
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary navigation */}
          <div className="flex">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center">
              <img
                src="/images/amawa_logo.png"
                alt="AMAWA Logo"
                className="h-12 w-auto"
              />
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Admin dropdown menu */}
            {user?.role === 'ADMIN' && (
              <div className="relative">
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
                >
                  <Shield className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>

                {/* Admin dropdown */}
                {adminMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setAdminMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-20 border border-gray-200">
                      {adminNavigation.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setAdminMenuOpen(false)}
                            className={`flex items-center px-4 py-2 text-sm hover:bg-gray-50 ${
                              isActive ? 'text-purple-600 bg-purple-50' : 'text-gray-700'
                            }`}
                          >
                            <Icon className="w-4 h-4 mr-3" />
                            {item.name}
                          </Link>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* User menu */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                    <p className="text-xs text-gray-500">{roleLabels[user.role] || user.role}</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-white">
                    <span className="text-white text-sm font-semibold">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block" />
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-20 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 inline mr-2" />
                        Configuración
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-base font-medium ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
            {user?.role === 'ADMIN' && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-purple-600 uppercase tracking-wider">
                  Administración
                </div>
                {adminNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-lg text-base font-medium ${
                        isActive
                          ? 'text-purple-600 bg-purple-50'
                          : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  )
                })}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
