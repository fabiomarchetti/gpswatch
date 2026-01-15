/**
 * React Hook per la gestione dei permessi utente
 * GPS Watch Tracker
 */

import { useMemo } from 'react'
import {
  UserWithRuolo,
  hasPermission,
  hasRole,
  isSviluppatore,
  canConfigureDevices,
  canManageUsers,
  canAccessControlRoom,
  canMonitorOthers,
  canViewOwnData,
  canManageSystemConfig,
  canManageGPSWatches,
  canReceiveEmergencyAlerts,
  canAccessSystemLogs,
  canModifyUser,
  canDeleteUser,
  getPermissionDescription,
  getRoleEmoji,
  LIVELLI_ACCESSO,
  RUOLI,
} from '@/lib/permissions'

/**
 * Hook per verificare i permessi dell'utente corrente
 * @param user - Oggetto utente con ruolo
 * @returns Oggetto con funzioni di verifica permessi
 */
export function usePermissions(user: UserWithRuolo | null) {
  const permissions = useMemo(() => {
    if (!user) {
      return {
        // Nessun permesso se l'utente non è autenticato
        hasPermission: () => false,
        hasRole: () => false,
        isSviluppatore: false,
        canConfigureDevices: false,
        canManageUsers: false,
        canAccessControlRoom: false,
        canMonitorOthers: false,
        canViewOwnData: false,
        canManageSystemConfig: false,
        canManageGPSWatches: false,
        canReceiveEmergencyAlerts: false,
        canAccessSystemLogs: false,
        canModifyUser: () => false,
        canDeleteUser: false,
        permissionDescription: 'Non autenticato',
        roleEmoji: '🚫',
        userLevel: 0,
        roleName: null,
      }
    }

    return {
      // Funzioni di verifica
      hasPermission: (requiredLevel: number) => hasPermission(user.ruolo.livello, requiredLevel),
      hasRole: (roleName: string) => hasRole(user, roleName),

      // Permessi specifici
      isSviluppatore: isSviluppatore(user),
      canConfigureDevices: canConfigureDevices(user),
      canManageUsers: canManageUsers(user),
      canAccessControlRoom: canAccessControlRoom(user),
      canMonitorOthers: canMonitorOthers(user),
      canViewOwnData: canViewOwnData(user),
      canManageSystemConfig: canManageSystemConfig(user),
      canManageGPSWatches: canManageGPSWatches(user),
      canReceiveEmergencyAlerts: canReceiveEmergencyAlerts(user),
      canAccessSystemLogs: canAccessSystemLogs(user),
      canModifyUser: (targetUserLevel: number) => canModifyUser(user, targetUserLevel),
      canDeleteUser: canDeleteUser(user),

      // Informazioni utente
      permissionDescription: getPermissionDescription(user.ruolo.livello),
      roleEmoji: getRoleEmoji(user.ruolo.nome),
      userLevel: user.ruolo.livello,
      roleName: user.ruolo.nome,
    }
  }, [user])

  return permissions
}

/**
 * Hook semplificato per verificare se l'utente ha un livello minimo richiesto
 * @param user - Oggetto utente con ruolo
 * @param requiredLevel - Livello minimo richiesto
 * @returns true se l'utente ha il livello richiesto
 */
export function useHasMinLevel(user: UserWithRuolo | null, requiredLevel: number): boolean {
  return useMemo(() => {
    if (!user) return false
    return hasPermission(user.ruolo.livello, requiredLevel)
  }, [user, requiredLevel])
}

/**
 * Hook per verificare se l'utente ha uno specifico ruolo
 * @param user - Oggetto utente con ruolo
 * @param roleName - Nome del ruolo da verificare
 * @returns true se l'utente ha il ruolo specificato
 */
export function useHasRole(user: UserWithRuolo | null, roleName: string): boolean {
  return useMemo(() => {
    if (!user) return false
    return hasRole(user, roleName)
  }, [user, roleName])
}

// Esporta anche le costanti per uso diretto
export { LIVELLI_ACCESSO, RUOLI }
