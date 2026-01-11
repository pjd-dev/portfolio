/**
 * COD Profiles
 *
 * Profiles allow tuning heuristics without changing existing behavior.
 * Current profiles:
 * - basic: default, baseline heuristics (existing behavior)
 * - adhd: future variant with alternative tuning
 *
 * NOTE: Behavior remains identical for the default profile (basic) until
 * profile-specific logic is introduced.
 */
export type CodProfile = 'basic' | 'adhd';

export const DEFAULT_COD_PROFILE: CodProfile = 'basic';
