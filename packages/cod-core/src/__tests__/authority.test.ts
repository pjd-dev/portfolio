/**
 * Authority Enforcement Tests
 *
 * Tests for the COD authority system that controls delegation gates
 * for task execution (human-only, agent, agent+review, agent-limited).
 */

import { describe, it, expect } from 'vitest';
import {
  type DelegationMode,
  type CallerAuthority,
  type TaskAuthorityConfig,
  type AuthorizedAction,
  normalizeDelegationMode,
  assessRiskLevel,
  checkAuthority,
  canIncludeInAgentSession,
  extractAuthorityConfig,
  formatAuthorityResult,
} from '../authority.js';

describe('authority', () => {
  describe('normalizeDelegationMode', () => {
    it('returns human-only when humanOnly is true', () => {
      const result = normalizeDelegationMode({ humanOnly: true });
      expect(result).toBe('human-only');
    });

    it('returns human-only from tag', () => {
      const result = normalizeDelegationMode({
        tags: ['human-only', 'urgent'],
      });
      expect(result).toBe('human-only');
    });

    it('returns agent when delegatable is true', () => {
      const result = normalizeDelegationMode({ delegatable: true });
      expect(result).toBe('agent');
    });

    it('returns agent from agent-ok tag', () => {
      const result = normalizeDelegationMode({ tags: ['agent-ok'] });
      expect(result).toBe('agent');
    });

    it('returns agent-limited when budget constraints present', () => {
      const result = normalizeDelegationMode({ aiTokenBudget: 50000 });
      expect(result).toBe('agent-limited');
    });

    it('returns agent-limited with time budget', () => {
      const result = normalizeDelegationMode({ aiTimeBudgetMin: 30 });
      expect(result).toBe('agent-limited');
    });

    it('returns explicit delegationMode', () => {
      const result = normalizeDelegationMode({
        delegationMode: 'agent+review',
      });
      expect(result).toBe('agent+review');
    });

    it('normalizes agent-review variation', () => {
      const result = normalizeDelegationMode({
        delegationMode: 'agent-review' as DelegationMode,
      });
      expect(result).toBe('agent+review');
    });

    it('defaults to agent+review', () => {
      const result = normalizeDelegationMode({});
      expect(result).toBe('agent+review');
    });

    it('humanOnly takes precedence over delegatable', () => {
      const result = normalizeDelegationMode({
        humanOnly: true,
        delegatable: true,
      });
      expect(result).toBe('human-only');
    });
  });

  describe('assessRiskLevel', () => {
    it('returns critical for security tag', () => {
      const result = assessRiskLevel({ tags: ['security'] });
      expect(result).toBe('critical');
    });

    it('returns critical for financial tag', () => {
      const result = assessRiskLevel({ tags: ['financial'] });
      expect(result).toBe('critical');
    });

    it('returns critical for production tag', () => {
      const result = assessRiskLevel({ tags: ['production', 'task'] });
      expect(result).toBe('critical');
    });

    it('returns high for deployment tag', () => {
      const result = assessRiskLevel({ tags: ['deployment'] });
      expect(result).toBe('high');
    });

    it('returns high for infrastructure tag', () => {
      const result = assessRiskLevel({ tags: ['infrastructure'] });
      expect(result).toBe('high');
    });

    it('returns medium for refactor tag', () => {
      const result = assessRiskLevel({ tags: ['refactor'] });
      expect(result).toBe('medium');
    });

    it('returns medium for breaking-change tag', () => {
      const result = assessRiskLevel({ tags: ['breaking-change'] });
      expect(result).toBe('medium');
    });

    it('returns low for normal tags', () => {
      const result = assessRiskLevel({ tags: ['task', 'feature', 'ui'] });
      expect(result).toBe('low');
    });

    it('returns low for empty tags', () => {
      const result = assessRiskLevel({ tags: [] });
      expect(result).toBe('low');
    });

    it('critical takes precedence over high', () => {
      const result = assessRiskLevel({ tags: ['deployment', 'security'] });
      expect(result).toBe('critical');
    });
  });

  describe('checkAuthority', () => {
    describe('human caller', () => {
      it('always allows human callers', () => {
        const result = checkAuthority('human', 'execute', { humanOnly: true });

        expect(result.allowed).toBe(true);
        expect(result.requiresReview).toBe(false);
      });

      it('allows human on critical tasks', () => {
        const result = checkAuthority('human', 'execute', {
          tags: ['security', 'production'],
        });

        expect(result.allowed).toBe(true);
      });
    });

    describe('read action', () => {
      it('allows agent to read human-only tasks', () => {
        const result = checkAuthority('agent', 'read', { humanOnly: true });

        expect(result.allowed).toBe(true);
      });

      it('allows system to read any task', () => {
        const result = checkAuthority('system', 'read', { humanOnly: true });

        expect(result.allowed).toBe(true);
      });
    });

    describe('human-only mode', () => {
      it('blocks agent from executing', () => {
        const result = checkAuthority('agent', 'execute', { humanOnly: true });

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('human-only');
        expect(result.effectiveMode).toBe('human-only');
      });

      it('blocks agent from updating', () => {
        const result = checkAuthority('agent', 'update', {
          tags: ['human-only'],
        });

        expect(result.allowed).toBe(false);
      });

      it('blocks system from executing', () => {
        const result = checkAuthority('system', 'execute', { humanOnly: true });

        expect(result.allowed).toBe(false);
      });
    });

    describe('critical risk', () => {
      it('blocks agent execute on critical tasks', () => {
        const result = checkAuthority('agent', 'execute', {
          delegatable: true,
          tags: ['security'],
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Critical-risk');
        expect(result.riskLevel).toBe('critical');
      });

      it('blocks agent complete on critical tasks', () => {
        const result = checkAuthority('agent', 'complete', {
          delegationMode: 'agent',
          tags: ['production'],
        });

        expect(result.allowed).toBe(false);
      });

      it('allows agent update on critical (no execute)', () => {
        const result = checkAuthority('agent', 'update', {
          delegationMode: 'agent',
          tags: ['security'],
        });

        expect(result.allowed).toBe(true);
      });
    });

    describe('agent mode', () => {
      it('allows full delegation', () => {
        const result = checkAuthority('agent', 'execute', {
          delegationMode: 'agent',
        });

        expect(result.allowed).toBe(true);
        expect(result.requiresReview).toBe(false);
        expect(result.effectiveMode).toBe('agent');
      });

      it('allows complete without review', () => {
        const result = checkAuthority('agent', 'complete', {
          delegatable: true,
        });

        expect(result.allowed).toBe(true);
        expect(result.requiresReview).toBe(false);
      });
    });

    describe('agent+review mode', () => {
      it('allows with review required', () => {
        const result = checkAuthority('agent', 'execute', {
          delegationMode: 'agent+review',
        });

        expect(result.allowed).toBe(true);
        expect(result.requiresReview).toBe(true);
        expect(result.effectiveMode).toBe('agent+review');
      });

      it('default mode requires review', () => {
        const result = checkAuthority('agent', 'execute', {});

        expect(result.allowed).toBe(true);
        expect(result.requiresReview).toBe(true);
      });
    });

    describe('agent-limited mode', () => {
      it('returns budget constraints', () => {
        const result = checkAuthority('agent', 'execute', {
          aiTokenBudget: 50000,
          aiTimeBudgetMin: 30,
        });

        expect(result.allowed).toBe(true);
        expect(result.requiresReview).toBe(true);
        expect(result.effectiveMode).toBe('agent-limited');
        expect(result.budget?.tokenLimit).toBe(50000);
        expect(result.budget?.timeLimitMin).toBe(30);
      });

      it('returns partial budget', () => {
        const result = checkAuthority('agent', 'execute', {
          aiTokenBudget: 100000,
        });

        expect(result.budget?.tokenLimit).toBe(100000);
        expect(result.budget?.timeLimitMin).toBeUndefined();
      });
    });
  });

  describe('canIncludeInAgentSession', () => {
    it('excludes human-only tasks', () => {
      const result = canIncludeInAgentSession({ humanOnly: true });

      expect(result.includable).toBe(false);
      expect(result.reason).toContain('human-only');
    });

    it('excludes critical-risk tasks', () => {
      const result = canIncludeInAgentSession({
        delegatable: true,
        tags: ['security'],
      });

      expect(result.includable).toBe(false);
      expect(result.reason).toContain('Critical-risk');
    });

    it('includes agent tasks without review', () => {
      const result = canIncludeInAgentSession({ delegationMode: 'agent' });

      expect(result.includable).toBe(true);
      expect(result.requiresReview).toBe(false);
    });

    it('includes agent+review tasks with review flag', () => {
      const result = canIncludeInAgentSession({
        delegationMode: 'agent+review',
      });

      expect(result.includable).toBe(true);
      expect(result.requiresReview).toBe(true);
    });

    it('includes agent-limited with review flag', () => {
      const result = canIncludeInAgentSession({ aiTokenBudget: 50000 });

      expect(result.includable).toBe(true);
      expect(result.requiresReview).toBe(true);
    });
  });

  describe('extractAuthorityConfig', () => {
    it('extracts delegation_mode', () => {
      const config = extractAuthorityConfig({
        delegation_mode: 'agent+review',
      });

      expect(config.delegationMode).toBe('agent+review');
    });

    it('extracts delegatable boolean', () => {
      const config = extractAuthorityConfig({ delegatable: true });

      expect(config.delegatable).toBe(true);
    });

    it('extracts human_only', () => {
      const config = extractAuthorityConfig({ human_only: true });

      expect(config.humanOnly).toBe(true);
    });

    it('extracts budget fields', () => {
      const config = extractAuthorityConfig({
        ai_token_budget: 80000,
        ai_time_budget_min: 45,
      });

      expect(config.aiTokenBudget).toBe(80000);
      expect(config.aiTimeBudgetMin).toBe(45);
    });

    it('extracts tags as strings', () => {
      const config = extractAuthorityConfig({
        tags: ['task', 'agent-ok', 'feature'],
      });

      expect(config.tags).toEqual(['task', 'agent-ok', 'feature']);
    });

    it('handles missing tags', () => {
      const config = extractAuthorityConfig({});

      expect(config.tags).toEqual([]);
    });
  });

  describe('formatAuthorityResult', () => {
    it('formats allowed result', () => {
      const result = formatAuthorityResult({
        allowed: true,
        effectiveMode: 'agent',
        requiresReview: false,
        riskLevel: 'low',
      });

      expect(result).toContain('✅');
      expect(result).toContain('agent');
      expect(result).toContain('low');
    });

    it('formats review required', () => {
      const result = formatAuthorityResult({
        allowed: true,
        effectiveMode: 'agent+review',
        requiresReview: true,
        riskLevel: 'medium',
      });

      expect(result).toContain('⚠️');
      expect(result).toContain('Human review required');
    });

    it('formats budget constraints', () => {
      const result = formatAuthorityResult({
        allowed: true,
        effectiveMode: 'agent-limited',
        requiresReview: true,
        riskLevel: 'low',
        budget: { tokenLimit: 50000, timeLimitMin: 30 },
      });

      expect(result).toContain('📊');
      expect(result).toContain('50000');
      expect(result).toContain('⏱️');
      expect(result).toContain('30 minutes');
    });

    it('formats blocked result', () => {
      const result = formatAuthorityResult({
        allowed: false,
        reason: 'Task is human-only',
        effectiveMode: 'human-only',
        requiresReview: false,
        riskLevel: 'high',
      });

      expect(result).toContain('❌');
      expect(result).toContain('human-only');
      expect(result).toContain('high');
    });
  });

  describe('integration scenarios', () => {
    it('typical agent task workflow', () => {
      const frontmatter = {
        delegation_mode: 'agent',
        tags: ['task', 'refactor', 'agent-ok'],
      };

      const config = extractAuthorityConfig(frontmatter);
      const checkResult = checkAuthority('agent', 'execute', config);
      const sessionResult = canIncludeInAgentSession(config);

      expect(config.delegationMode).toBe('agent');
      expect(checkResult.allowed).toBe(true);
      expect(checkResult.riskLevel).toBe('medium'); // refactor tag
      expect(sessionResult.includable).toBe(true);
    });

    it('security review task workflow', () => {
      const frontmatter = {
        tags: ['security', 'review', 'human-only'],
      };

      const config = extractAuthorityConfig(frontmatter);
      const agentCheck = checkAuthority('agent', 'execute', config);
      const humanCheck = checkAuthority('human', 'execute', config);

      expect(agentCheck.allowed).toBe(false);
      expect(humanCheck.allowed).toBe(true);
      expect(agentCheck.riskLevel).toBe('critical');
    });

    it('budget-constrained agent task', () => {
      const frontmatter = {
        ai_token_budget: 120000,
        ai_time_budget_min: 60,
        tags: ['cod', 'ml', 'task'],
      };

      const config = extractAuthorityConfig(frontmatter);
      const checkResult = checkAuthority('agent', 'execute', config);

      expect(checkResult.effectiveMode).toBe('agent-limited');
      expect(checkResult.allowed).toBe(true);
      expect(checkResult.budget?.tokenLimit).toBe(120000);
      expect(checkResult.budget?.timeLimitMin).toBe(60);
    });
  });
});
