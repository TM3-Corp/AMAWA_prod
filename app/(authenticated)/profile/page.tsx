'use client'

import { useEffect, useState } from 'react'
import {
  User,
  Mail,
  Shield,
  Clock,
  UserPlus,
  Save,
  X,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  Key
} from 'lucide-react'

interface UserData {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
  createdAt: string
  lastLogin: string | null
}

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [allUsers, setAllUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create user form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'TECHNICIAN'
  })

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch current user
      const userResponse = await fetch('/api/auth/user')
      if (!userResponse.ok) {
        throw new Error('Error al obtener usuario actual')
      }
      const userData = await userResponse.json()
      setCurrentUser(userData.user)

      // Fetch all users (only if admin)
      if (userData.user.role === 'ADMIN') {
        const usersResponse = await fetch('/api/users')
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setAllUsers(usersData.users)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!createForm.email || !createForm.password) {
      setError('Email y contraseña son requeridos')
      return
    }

    try {
      setCreateLoading(true)
      setError(null)

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear usuario')
      }

      // Success - reset form and refresh
      setCreateForm({
        email: '',
        password: '',
        name: '',
        role: 'TECHNICIAN'
      })
      setShowCreateForm(false)
      setShowPassword(false)
      await fetchData()

      alert('Usuario creado exitosamente')
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`¿Está seguro de ${currentStatus ? 'desactivar' : 'activar'} este usuario?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar usuario')
      }

      await fetchData()
    } catch (err: any) {
      setError(err.message || 'Error al actualizar usuario')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!confirm(`¿Está seguro de cambiar el rol de este usuario?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar rol')
      }

      await fetchData()
    } catch (err: any) {
      setError(err.message || 'Error al actualizar rol')
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPasswordSuccess(false)

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('Todos los campos son requeridos')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    try {
      setPasswordLoading(true)

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar contraseña')
      }

      // Success
      setPasswordSuccess(true)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)

      setTimeout(() => {
        setShowPasswordChange(false)
        setPasswordSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Error al cambiar contraseña')
    } finally {
      setPasswordLoading(false)
    }
  }

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    TECHNICIAN: 'Técnico',
    MANAGER: 'Gerente',
    CLIENT: 'Cliente'
  }

  const roleBadgeColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    TECHNICIAN: 'bg-blue-100 text-blue-800 border-blue-200',
    MANAGER: 'bg-green-100 text-green-800 border-green-200',
    CLIENT: 'bg-gray-100 text-gray-800 border-gray-200'
  }

  if (loading) {
    return (
      <>
        
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </>
    )
  }

  if (!currentUser) {
    return (
      <>
        
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error al cargar perfil</h2>
            <button
              onClick={fetchData}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <X className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Perfil y Configuración
          </h1>
          <p className="text-gray-600">
            Administra tu perfil y usuarios del sistema
          </p>
        </div>

        {/* Current User Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Mi Perfil</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${roleBadgeColors[currentUser.role]}`}>
              <Shield className="w-4 h-4 mr-1.5" />
              {roleLabels[currentUser.role]}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="text-lg font-semibold text-gray-900">{currentUser.name || 'Sin nombre'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold text-gray-900">{currentUser.email}</p>
              </div>
            </div>

            {currentUser.lastLogin && (
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Último acceso</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(currentUser.lastLogin).toLocaleString('es-CL')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 ${currentUser.isActive ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                <CheckCircle2 className={`w-6 h-6 ${currentUser.isActive ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p className="text-lg font-semibold text-gray-900">
                  {currentUser.isActive ? 'Activo' : 'Inactivo'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cambiar Contraseña</h2>
              <p className="text-sm text-gray-600 mt-1">
                Actualiza tu contraseña de acceso al sistema
              </p>
            </div>
            <button
              onClick={() => {
                setShowPasswordChange(!showPasswordChange)
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                setPasswordSuccess(false)
                setError(null)
              }}
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              {showPasswordChange ? (
                <>
                  <X className="w-5 h-5 mr-2" />
                  Cancelar
                </>
              ) : (
                <>
                  <Key className="w-5 h-5 mr-2" />
                  Cambiar Contraseña
                </>
              )}
            </button>
          </div>

          {/* Password Change Form */}
          {showPasswordChange && (
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
              {passwordSuccess && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
                  <p className="text-green-800 font-medium">Contraseña cambiada exitosamente</p>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Actual *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-10"
                      placeholder="••••••••"
                      disabled={passwordLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña * (mínimo 6 caracteres)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-10"
                      placeholder="••••••••"
                      disabled={passwordLoading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-10"
                      placeholder="••••••••"
                      disabled={passwordLoading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange(false)
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                      setShowCurrentPassword(false)
                      setShowNewPassword(false)
                      setShowConfirmPassword(false)
                    }}
                    disabled={passwordLoading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Cambiando...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Cambiar Contraseña
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* User Management Section (Admin Only) */}
        {currentUser.role === 'ADMIN' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Gestión de Usuarios</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {allUsers.length} usuario{allUsers.length !== 1 ? 's' : ''} registrado{allUsers.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showCreateForm ? (
                  <>
                    <X className="w-5 h-5 mr-2" />
                    Cancelar
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Crear Usuario
                  </>
                )}
              </button>
            </div>

            {/* Create User Form */}
            {showCreateForm && (
              <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Nuevo Usuario</h3>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="usuario@ejemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nombre completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={createForm.password}
                          onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rol
                      </label>
                      <select
                        value={createForm.role}
                        onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="TECHNICIAN">Técnico</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="MANAGER">Gerente</option>
                        <option value="CLIENT">Cliente</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false)
                        setCreateForm({ email: '', password: '', name: '', role: 'TECHNICIAN' })
                        setShowPassword(false)
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Crear Usuario
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Usuario</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rol</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Creado</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-semibold">
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name || 'Sin nombre'}</p>
                            {user.id === currentUser.id && (
                              <span className="text-xs text-blue-600 font-medium">(Tú)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{user.email}</td>
                      <td className="py-3 px-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          disabled={user.id === currentUser.id}
                          className={`text-sm px-3 py-1 rounded-full border font-semibold ${roleBadgeColors[user.role]} ${
                            user.id === currentUser.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
                          }`}
                        >
                          <option value="ADMIN">Administrador</option>
                          <option value="TECHNICIAN">Técnico</option>
                          <option value="MANAGER">Gerente</option>
                          <option value="CLIENT">Cliente</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {new Date(user.createdAt).toLocaleDateString('es-CL')}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          disabled={user.id === currentUser.id}
                          className={`text-sm px-3 py-1 rounded-lg font-medium transition-colors ${
                            user.id === currentUser.id
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : user.isActive
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {user.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
