/**
 * Protected Paths Guardrail Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateWritePath,
  checkCodToolRequired,
  enforceTemplateUsage,
  validateWriteOperation,
  PROTECTED_PATHS,
  INVALID_FILENAME_PATTERNS,
  COD_TOOL_ROUTES,
  TEMPLATE_REQUIRED_PATHS,
  FREE_FORM_PATHS,
} from '../guardrails/protected-paths.js';

describe('Protected Paths Guardrail', () => {
  describe('PROTECTED_PATHS configuration', () => {
    it('has entries for critical system paths', () => {
      const patterns = PROTECTED_PATHS.map((p) => p.pattern.source);
      expect(patterns).toContain('^_state\\/');
      expect(patterns).toContain('^core\\/avatar');
      expect(patterns).toContain('^core\\/world');
      expect(patterns).toContain('^core\\/cod');
    });

    it('each entry has requiredTool and reason', () => {
      for (const path of PROTECTED_PATHS) {
        expect(path.requiredTool).toBeDefined();
        expect(path.reason).toBeDefined();
        expect(path.reason.length).toBeGreaterThan(0);
      }
    });
  });

  describe('INVALID_FILENAME_PATTERNS', () => {
    it('blocks double extensions', () => {
      expect(
        INVALID_FILENAME_PATTERNS.some((p) => p.test('file.json.md'))
      ).toBe(true);
      expect(
        INVALID_FILENAME_PATTERNS.some((p) => p.test('file.yaml.md'))
      ).toBe(true);
      expect(INVALID_FILENAME_PATTERNS.some((p) => p.test('file.yml.md'))).toBe(
        true
      );
    });

    it('allows normal .md files', () => {
      expect(INVALID_FILENAME_PATTERNS.every((p) => !p.test('file.md'))).toBe(
        true
      );
      expect(
        INVALID_FILENAME_PATTERNS.every((p) => !p.test('my-task.md'))
      ).toBe(true);
    });
  });

  describe('validateWritePath', () => {
    describe('invalid filenames', () => {
      it('blocks .json.md double extension', () => {
        const result = validateWritePath('_state/cod/goals.json.md');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid filename pattern');
      });

      it('blocks .yaml.md double extension', () => {
        const result = validateWritePath('config.yaml.md');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid filename pattern');
      });

      it('allows normal filenames', () => {
        const result = validateWritePath('notes/my-note.md', 'user');
        expect(result.valid).toBe(true);
      });
    });

    describe('protected paths', () => {
      it('blocks _state/ for user scope', () => {
        const result = validateWritePath('_state/cod/goals.md', 'user');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Protected path');
        expect(result.suggestedTool).toBeDefined();
      });

      it('blocks core/avatar for user scope', () => {
        const result = validateWritePath('core/avatar/vitals.md', 'user');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Protected path');
      });

      it('blocks core/world for user scope', () => {
        const result = validateWritePath('core/world/state.md', 'user');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Protected path');
      });

      it('allows core/avatar for avatar scope', () => {
        const result = validateWritePath('core/avatar/vitals.md', 'avatar');
        expect(result.valid).toBe(true);
      });

      it('allows core/world for world scope', () => {
        const result = validateWritePath('core/world/state.md', 'world');
        expect(result.valid).toBe(true);
      });

      it('allows everything for system scope', () => {
        expect(validateWritePath('_state/cod/goals.md', 'system').valid).toBe(
          true
        );
        expect(validateWritePath('core/avatar/vitals.md', 'system').valid).toBe(
          true
        );
        expect(validateWritePath('core/world/state.md', 'system').valid).toBe(
          true
        );
      });
    });

    describe('normalizes paths', () => {
      it('handles leading slash', () => {
        const result = validateWritePath('/notes/my-note.md', 'user');
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('checkCodToolRequired', () => {
    describe('tasks/ path', () => {
      it('requires update_task for updates', () => {
        const result = checkCodToolRequired('tasks/my-task.md', 'update');
        expect(result.blocked).toBe(true);
        expect(result.suggestedTool).toBe('update_task');
        expect(result.reason).toContain('COD-first');
      });

      it('requires create_from_template for creation', () => {
        const result = checkCodToolRequired('tasks/my-task.md', 'create');
        expect(result.blocked).toBe(true);
        expect(result.suggestedTool).toBe('create_from_template');
      });
    });

    describe('sessions/ path', () => {
      it('requires session tools', () => {
        const result = checkCodToolRequired('sessions/2026-01-12.md', 'update');
        expect(result.blocked).toBe(true);
        expect(result.suggestedTool).toContain('session');
      });
    });

    describe('Goals/ path', () => {
      it('requires goal tools', () => {
        const result = checkCodToolRequired(
          'Goals/platform-foundation.md',
          'update'
        );
        expect(result.blocked).toBe(true);
        expect(result.suggestedTool).toContain('goal');
      });
    });

    describe('core/avatar path', () => {
      it('blocks create operations', () => {
        const result = checkCodToolRequired(
          'core/avatar/new-file.md',
          'create'
        );
        expect(result.blocked).toBe(true);
        expect(result.error).toContain('does not support');
      });

      it('requires avatar tools for updates', () => {
        const result = checkCodToolRequired('core/avatar/vitals.md', 'update');
        expect(result.blocked).toBe(true);
        expect(result.suggestedTool).toContain('human_state');
      });
    });

    describe('free-form paths', () => {
      it('allows notes/ without restrictions', () => {
        const result = checkCodToolRequired('notes/scratch.md', 'create');
        expect(result.blocked).toBe(false);
      });

      it('allows dump/ without restrictions', () => {
        const result = checkCodToolRequired('dump/temp.md', 'update');
        expect(result.blocked).toBe(false);
      });

      it('allows doc/ without restrictions', () => {
        const result = checkCodToolRequired('doc/README.md', 'create');
        expect(result.blocked).toBe(false);
      });
    });
  });

  describe('enforceTemplateUsage', () => {
    describe('template-required paths', () => {
      it('blocks raw create for tasks/', () => {
        const result = enforceTemplateUsage('tasks/new-task.md', true);
        expect(result.blocked).toBe(true);
        expect(result.suggestedTool).toBe('create_from_template');
        expect(result.suggestedParams?.templateType).toBe('task');
      });

      it('blocks raw create for sessions/', () => {
        const result = enforceTemplateUsage('sessions/2026-01-12.md', true);
        expect(result.blocked).toBe(true);
        expect(result.suggestedParams?.templateType).toBe('session');
      });

      it('blocks raw create for Goals/', () => {
        const result = enforceTemplateUsage('Goals/new-goal.md', true);
        expect(result.blocked).toBe(true);
        expect(result.suggestedParams?.templateType).toBe('goal');
      });

      it('blocks raw create for knowledge/', () => {
        const result = enforceTemplateUsage('knowledge/topic.md', true);
        expect(result.blocked).toBe(true);
        expect(result.suggestedParams?.templateType).toBe('knowledge');
      });
    });

    describe('existing files', () => {
      it('allows updates to template-required paths', () => {
        const result = enforceTemplateUsage('tasks/existing-task.md', false);
        expect(result.blocked).toBe(false);
      });
    });

    describe('free-form paths', () => {
      it('allows raw create for notes/', () => {
        const result = enforceTemplateUsage('notes/scratch.md', true);
        expect(result.blocked).toBe(false);
      });

      it('allows raw create for dump/', () => {
        const result = enforceTemplateUsage('dump/temp.md', true);
        expect(result.blocked).toBe(false);
      });
    });
  });

  describe('validateWriteOperation (combined)', () => {
    it('validates path, template, and COD routing', () => {
      // Protected path fails
      const protected1 = validateWriteOperation('_state/cod/goals.md', {
        callerScope: 'user',
        isNewFile: false,
      });
      expect(protected1.valid).toBe(false);

      // Invalid filename fails
      const invalid = validateWriteOperation('file.json.md', {
        callerScope: 'user',
        isNewFile: false,
      });
      expect(invalid.valid).toBe(false);

      // Template required fails for new task
      const template = validateWriteOperation('tasks/new-task.md', {
        callerScope: 'user',
        isNewFile: true,
      });
      expect(template.valid).toBe(false);
      expect(template.suggestedTool).toBe('create_from_template');

      // Free-form path succeeds
      const free = validateWriteOperation('notes/scratch.md', {
        callerScope: 'user',
        isNewFile: true,
      });
      expect(free.valid).toBe(true);
    });

    it('system scope bypasses all checks except filename', () => {
      // System can write to protected paths
      const result = validateWriteOperation('_state/cod/goals.md', {
        callerScope: 'system',
        isNewFile: false,
      });
      expect(result.valid).toBe(true);

      // But invalid filename still fails
      const invalid = validateWriteOperation('file.json.md', {
        callerScope: 'system',
        isNewFile: false,
      });
      expect(invalid.valid).toBe(false);
    });
  });
});
