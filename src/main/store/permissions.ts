import type { SitePermissionDecision } from '../../shared/types'

/** Persisted per-origin browser permission decisions. */
export interface PermissionsShape {
  decisions: SitePermissionDecision[]
}
