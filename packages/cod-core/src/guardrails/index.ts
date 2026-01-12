/**
 * Guardrails Module
 *
 * Exports all guardrail utilities for vault protection:
 * - Protected paths validation
 * - COD tool routing enforcement
 * - Template enforcement
 * - Event system for state changes
 */

// Protected paths and validation
export {
  PROTECTED_PATHS,
  INVALID_FILENAME_PATTERNS,
  COD_TOOL_ROUTES,
  TEMPLATE_REQUIRED_PATHS,
  FREE_FORM_PATHS,
  SCOPE_CAPABILITIES,
  validateWritePath,
  checkCodToolRequired,
  enforceTemplateUsage,
  validateWriteOperation,
} from './protected-paths.js';

export type {
  ProtectedPath,
  CodToolRoute,
  CallerScope,
  PathValidationResult,
  CodToolCheck,
  TemplateEnforcementResult,
} from './protected-paths.js';

// Event system
export {
  KNOWN_EVENTS,
  SURPRISE_EVENT_DEFAULTS,
  findKnownEvent,
  isKnownEventType,
  getSurpriseEventDefaults,
  validateSurpriseEvent,
  createEventLogEntry,
  calculateEventImpact,
  processEvent,
  getAllEventTypes,
  getEventsAffecting,
} from './event-system.js';

export type {
  EventAffects,
  KnownEvent,
  AvatarImpact,
  WorldImpact,
  EventResult,
  SurpriseEvent,
  EventLogEntry,
} from './event-system.js';
