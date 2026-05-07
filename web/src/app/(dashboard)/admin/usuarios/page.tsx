'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { usersApi } from '@/lib/api'
import type { User, Role } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_META: Record<Role, { label: string; rowCls: string; dotCls: string }> = {
  admin:     { label: 'Admin',     rowCls: 'bg-purple-500/20 text-purple-300 border-purple-500/30',  dotCls: 'bg-purple-400'  },
  disenador: { label: 'Diseñador', rowCls: 'bg-blue-500/20   text-blue-300   border-blue-500/30',    dotCls: 'bg-blue-400'    },
  cliente:   { label: 'Cliente',   rowCls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dotCls: 'bg-emerald-400' },
}

const TABS: Array<{ id: 'all' | Role; label: string }> = [
  { id: 'all',       label: 'Todos'     },
  { id: 'admin',     label: 'Admin'     },
  { id: 'disenador', label: 'Diseñador' },
  { id: 'cliente',   label: 'Cliente'   },
]

const inputCls =
  'w-full rounded-lg bg-[#1A1F3A] border border-[#2A3050] text-white text-sm px-3 py-2.5 ' +
  'placeholder:text-zinc-600 focus:outline-none focus:border-[#4C58FF] transition-colors'

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#1E2540] ${className ?? ''}`} />
}

function RoleBadge({ role }: { role: Role }) {
  const m = ROLE_META[role]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${m.rowCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dotCls}`} />
      {m.label}
    </span>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Activo</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-300 border border-red-500/30"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Inactivo</span>
}

function Avatar({ name, role }: { name: string; role: Role }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
  const bg = { admin: 'bg-purple-700', disenador: 'bg-blue-700', cliente: 'bg-emerald-800' }[role]
  return (
    <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {initials || '?'}
    </div>
  )
}

function fmt(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type EditForm      = { name: string; email: string; role: Role; isActive: boolean }
type NewForm       = { name: string; email: string; role: Role; password: string }
type ConfirmAction = { type: 'deactivate' | 'activate' | 'delete'; user: User }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsuariosPage() {
  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search,       setSearch]       = useState('')
  const [roleTab,      setRoleTab]      = useState<'all' | Role>('all')
  const [showInactive, setShowInactive] = useState(false)

  // Edit drawer
  const [drawerUser,  setDrawerUser]  = useState<User | null>(null)
  const [editForm,    setEditForm]    = useState<EditForm>({ name: '', email: '', role: 'cliente', isActive: true })
  const [editSaving,  setEditSaving]  = useState(false)
  const [editError,   setEditError]   = useState('')

  // Password modal
  const [pwdUser,     setPwdUser]     = useState<User | null>(null)
  const [newPwd,      setNewPwd]      = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')
  const [pwdSaving,   setPwdSaving]   = useState(false)
  const [pwdError,    setPwdError]    = useState('')

  // New user modal
  const [newModal,   setNewModal]   = useState(false)
  const [newForm,    setNewForm]    = useState<NewForm>({ name: '', email: '', role: 'cliente', password: '' })
  const [newSaving,  setNewSaving]  = useState(false)
  const [newError,   setNewError]   = useState('')

  // Confirm modal
  const [confirm,       setConfirm]       = useState<ConfirmAction | null>(null)
  const [confirmSaving, setConfirmSaving] = useState(false)
  const [confirmError,  setConfirmError]  = useState('')

  // ─── Data loading ──────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { users: data } = await usersApi.list()
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ─── Derived state ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (roleTab !== 'all' && u.role !== roleTab) return false
      if (!showInactive && !u.isActive) return false
      if (search) {
        const s = search.toLowerCase()
        return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
      }
      return true
    })
  }, [users, roleTab, showInactive, search])

  const counts = useMemo(() => {
    const visible = (u: User) => u.isActive || showInactive
    return {
      all:       users.filter(u => visible(u)).length,
      admin:     users.filter(u => u.role === 'admin'     && visible(u)).length,
      disenador: users.filter(u => u.role === 'disenador' && visible(u)).length,
      cliente:   users.filter(u => u.role === 'cliente'   && visible(u)).length,
    }
  }, [users, showInactive])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function openDrawer(u: User) {
    setDrawerUser(u)
    setEditForm({ name: u.name, email: u.email, role: u.role, isActive: u.isActive })
    setEditError('')
  }

  async function handleSave() {
    if (!drawerUser) return
    setEditSaving(true)
    setEditError('')
    try {
      const updated = await usersApi.update(drawerUser._id, editForm)
      setUsers(prev => prev.map(u => u._id === updated._id ? updated : u))
      setDrawerUser(updated)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setEditSaving(false)
    }
  }

  async function handlePassword() {
    if (!pwdUser) return
    setPwdError('')
    if (newPwd.length < 8)       { setPwdError('Mínimo 8 caracteres'); return }
    if (newPwd !== confirmPwd)   { setPwdError('Las contraseñas no coinciden'); return }
    setPwdSaving(true)
    try {
      await usersApi.changePassword(pwdUser._id, newPwd)
      setPwdUser(null); setNewPwd(''); setConfirmPwd('')
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'Error al cambiar contraseña')
    } finally {
      setPwdSaving(false)
    }
  }

  async function handleNewUser() {
    setNewError('')
    if (!newForm.name || !newForm.email || !newForm.password)
      { setNewError('Completa todos los campos'); return }
    if (newForm.password.length < 8)
      { setNewError('La contraseña debe tener mínimo 8 caracteres'); return }
    setNewSaving(true)
    try {
      const created = await usersApi.create(newForm)
      setUsers(prev => [created, ...prev])
      setNewModal(false)
      setNewForm({ name: '', email: '', role: 'cliente', password: '' })
    } catch (err) {
      setNewError(err instanceof Error ? err.message : 'Error al crear usuario')
    } finally {
      setNewSaving(false)
    }
  }

  async function handleConfirm() {
    if (!confirm) return
    setConfirmSaving(true)
    setConfirmError('')
    try {
      if (confirm.type === 'delete') {
        await usersApi.delete(confirm.user._id)
        setUsers(prev => prev.filter(u => u._id !== confirm.user._id))
        if (drawerUser?._id === confirm.user._id) setDrawerUser(null)
      } else {
        const { user: updated } = await usersApi.toggleAccess(confirm.user._id)
        setUsers(prev => prev.map(u => u._id === updated._id ? updated : u))
        if (drawerUser?._id === updated._id) setDrawerUser(updated)
      }
      setConfirm(null)
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Error al procesar')
    } finally {
      setConfirmSaving(false)
    }
  }

  function openConfirm(type: ConfirmAction['type'], user: User) {
    setConfirm({ type, user })
    setConfirmError('')
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white text-xl font-bold">Usuarios</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{loading ? '…' : `${users.length} usuarios registrados`}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              className="w-60 rounded-lg bg-[#1A1F3A] border border-[#2A3050] text-white text-sm px-3 py-2 pl-8 placeholder:text-zinc-600 focus:outline-none focus:border-[#4C58FF] transition-colors"
              placeholder="Buscar nombre o email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setNewModal(true); setNewError('') }}
            className="rounded-lg bg-[#4C58FF] hover:bg-[#3B47F6] text-white text-sm font-medium px-4 py-2 transition-colors whitespace-nowrap"
          >
            + Nuevo usuario
          </button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 bg-[#111525] rounded-lg p-1 border border-[#1E2540]">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setRoleTab(t.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                roleTab === t.id
                  ? 'bg-[#1A1F3A] text-white border border-[#2A3050]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                roleTab === t.id ? 'bg-[#4C58FF]/30 text-[#7280FF]' : 'bg-[#1A1F3A] text-zinc-600'
              }`}>
                {counts[t.id]}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowInactive(v => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
            showInactive
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-[#111525] text-zinc-400 border-[#1E2540] hover:border-[#2A3050]'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showInactive ? 'bg-amber-400' : 'bg-zinc-600'}`} />
          {showInactive ? 'Mostrando inactivos' : 'Solo activos'}
        </button>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="bg-[#111525] rounded-xl border border-[#1E2540] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-[#1E2540]">
                {['Usuario', 'Email', 'Rol', 'Estado', 'Creado', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-zinc-500 px-4 py-3 first:pl-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1E2540]/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-44" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map(k => <Skeleton key={k} className="h-7 w-7 rounded-md" />)}
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-zinc-500 text-sm py-16">
                    {search ? `Sin resultados para "${search}"` : 'No hay usuarios'}
                  </td>
                </tr>
              ) : (
                filtered.map(u => (
                  <tr
                    key={u._id}
                    className={`border-b border-[#1E2540]/40 transition-colors hover:bg-[#1A1F3A]/30 ${
                      !u.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} role={u.role} />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{u.name}</p>
                          {u.company && <p className="text-zinc-500 text-xs truncate">{u.company}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 text-sm">{u.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3"><StatusBadge isActive={u.isActive} /></td>
                    <td className="px-4 py-3 text-zinc-500 text-sm whitespace-nowrap">{fmt(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <ActionBtn title="Editar" onClick={() => openDrawer(u)}>
                          <PencilIcon />
                        </ActionBtn>
                        <ActionBtn title="Cambiar contraseña" onClick={() => {
                          setPwdUser(u); setNewPwd(''); setConfirmPwd(''); setPwdError('')
                        }}>
                          <KeyIcon />
                        </ActionBtn>
                        <ActionBtn
                          title={u.isActive ? 'Desactivar acceso' : 'Activar acceso'}
                          onClick={() => openConfirm(u.isActive ? 'deactivate' : 'activate', u)}
                        >
                          {u.isActive ? <BanIcon /> : <CheckIcon />}
                        </ActionBtn>
                        <ActionBtn
                          title="Eliminar usuario"
                          onClick={() => openConfirm('delete', u)}
                          danger
                        >
                          <TrashIcon />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit Drawer ────────────────────────────────────────────────────── */}
      {drawerUser && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setDrawerUser(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0F1324] border-l border-[#1E2540] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2540] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={drawerUser.name} role={drawerUser.role} />
                <div className="min-w-0">
                  <h3 className="text-white font-semibold text-sm truncate">{drawerUser.name}</h3>
                  <p className="text-zinc-500 text-xs truncate">{drawerUser.email}</p>
                </div>
              </div>
              <button onClick={() => setDrawerUser(null)} className="text-zinc-500 hover:text-white text-2xl leading-none ml-3 shrink-0">×</button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nombre</label>
                <input
                  className={inputCls}
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                <input
                  type="email"
                  className={inputCls}
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Rol</label>
                <select
                  className={inputCls}
                  value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value as Role }))}
                >
                  <option value="cliente">Cliente</option>
                  <option value="disenador">Diseñador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Estado de acceso</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${editForm.isActive ? 'bg-[#4C58FF]' : 'bg-[#2A3050]'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${editForm.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-zinc-400 text-sm">{editForm.isActive ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>

              {/* Nivel (solo diseñadores con evaluación) */}
              {drawerUser.role === 'disenador' && drawerUser.level != null && (
                <div className="rounded-lg bg-[#1A1F3A] border border-[#2A3050] p-3 flex items-center justify-between">
                  <span className="text-zinc-400 text-xs">Nivel SAPIENS</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white text-lg font-bold">{drawerUser.level}</span>
                    <span className="text-zinc-500 text-xs">/ 10</span>
                  </div>
                </div>
              )}

              {/* Readonly info */}
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="Creado"     value={fmt(drawerUser.createdAt)} />
                <InfoCard label="Actualizado" value={fmt(drawerUser.updatedAt)} />
                {drawerUser.company && <InfoCard label="Empresa"  value={drawerUser.company} />}
                {drawerUser.phone   && <InfoCard label="Teléfono" value={drawerUser.phone}   />}
              </div>

              {editError && <ErrorBox>{editError}</ErrorBox>}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-[#1E2540] flex gap-3 shrink-0">
              <button
                onClick={() => setDrawerUser(null)}
                className="flex-1 rounded-lg border border-[#2A3050] text-zinc-400 hover:text-white text-sm py-2.5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={editSaving}
                className="flex-1 rounded-lg bg-[#4C58FF] hover:bg-[#3B47F6] disabled:opacity-50 text-white text-sm font-medium py-2.5 transition-colors"
              >
                {editSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Password Modal ─────────────────────────────────────────────────── */}
      {pwdUser && (
        <Modal onClose={() => setPwdUser(null)}>
          <h3 className="text-white font-semibold mb-1">Cambiar contraseña</h3>
          <p className="text-zinc-500 text-xs mb-5">{pwdUser.name} · {pwdUser.email}</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nueva contraseña</label>
              <input type="password" className={inputCls} placeholder="Mínimo 8 caracteres"
                value={newPwd} onChange={e => setNewPwd(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Confirmar contraseña</label>
              <input type="password" className={inputCls} placeholder="Repite la contraseña"
                value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
            </div>
            {pwdError && <ErrorBox>{pwdError}</ErrorBox>}
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setPwdUser(null)}
              className="flex-1 rounded-lg border border-[#2A3050] text-zinc-400 hover:text-white text-sm py-2.5 transition-colors">
              Cancelar
            </button>
            <button onClick={handlePassword} disabled={pwdSaving}
              className="flex-1 rounded-lg bg-[#4C58FF] hover:bg-[#3B47F6] disabled:opacity-50 text-white text-sm font-medium py-2.5 transition-colors">
              {pwdSaving ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── New User Modal ─────────────────────────────────────────────────── */}
      {newModal && (
        <Modal onClose={() => setNewModal(false)}>
          <h3 className="text-white font-semibold mb-5">Nuevo usuario</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nombre</label>
              <input className={inputCls} placeholder="Nombre completo"
                value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input type="email" className={inputCls} placeholder="usuario@email.com"
                value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Rol</label>
              <select className={inputCls} value={newForm.role}
                onChange={e => setNewForm(f => ({ ...f, role: e.target.value as Role }))}>
                <option value="cliente">Cliente</option>
                <option value="disenador">Diseñador</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Contraseña temporal</label>
              <input type="password" className={inputCls} placeholder="Mínimo 8 caracteres"
                value={newForm.password} onChange={e => setNewForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            {newError && <ErrorBox>{newError}</ErrorBox>}
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setNewModal(false)}
              className="flex-1 rounded-lg border border-[#2A3050] text-zinc-400 hover:text-white text-sm py-2.5 transition-colors">
              Cancelar
            </button>
            <button onClick={handleNewUser} disabled={newSaving}
              className="flex-1 rounded-lg bg-[#4C58FF] hover:bg-[#3B47F6] disabled:opacity-50 text-white text-sm font-medium py-2.5 transition-colors">
              {newSaving ? 'Creando…' : 'Crear usuario'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Confirm Modal ──────────────────────────────────────────────────── */}
      {confirm && (
        <Modal onClose={() => !confirmSaving && setConfirm(null)}>
          <h3 className="text-white font-semibold mb-2">
            {confirm.type === 'delete'     ? 'Eliminar usuario'  :
             confirm.type === 'deactivate' ? 'Desactivar acceso' : 'Activar acceso'}
          </h3>
          <p className="text-zinc-400 text-sm mb-6">
            {confirm.type === 'delete'
              ? `¿Eliminar la cuenta de ${confirm.user.name}? Esta acción no se puede deshacer.`
              : confirm.type === 'deactivate'
              ? `¿Desactivar el acceso de ${confirm.user.name}? No podrá iniciar sesión hasta ser reactivado.`
              : `¿Activar el acceso de ${confirm.user.name}?`}
          </p>
          {confirmError && <ErrorBox className="mb-4">{confirmError}</ErrorBox>}
          <div className="flex gap-3">
            <button
              onClick={() => setConfirm(null)}
              disabled={confirmSaving}
              className="flex-1 rounded-lg border border-[#2A3050] text-zinc-400 hover:text-white text-sm py-2.5 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirmSaving}
              className={`flex-1 rounded-lg text-white text-sm font-medium py-2.5 transition-colors disabled:opacity-50 ${
                confirm.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#4C58FF] hover:bg-[#3B47F6]'
              }`}
            >
              {confirmSaving ? 'Procesando…' :
               confirm.type === 'delete'     ? 'Eliminar'   :
               confirm.type === 'deactivate' ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[#0F1324] border border-[#1E2540] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        {children}
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#1A1F3A] border border-[#2A3050] p-3">
      <p className="text-zinc-500 text-xs mb-1">{label}</p>
      <p className="text-zinc-300 text-xs font-medium">{value}</p>
    </div>
  )
}

function ErrorBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-400 text-sm ${className ?? ''}`}>
      {children}
    </div>
  )
}

function ActionBtn({
  title, onClick, danger, children,
}: { title: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${
        danger
          ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
          : 'text-zinc-500 hover:text-white hover:bg-[#2A3050]'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Icons (inline SVG, no library) ──────────────────────────────────────────

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 0 1 2.828 2.828L11.828 15.828a4 4 0 0 1-1.414.586l-3 .75.75-3a4 4 0 0 1 .586-1.414z" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM5.468 19.674l1.08-4.32A7.966 7.966 0 0 0 11 17a8 8 0 0 0 8-8H11" />
    </svg>
  )
}

function BanIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3" />
    </svg>
  )
}
