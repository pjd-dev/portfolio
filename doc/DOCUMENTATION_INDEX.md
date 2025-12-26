# Documentation Index & Navigation Guide

A comprehensive guide to all documentation files in the vault-platform-full project.

---

## 🎯 Quick Navigation

### By Use Case

#### I want to...

- **Get started quickly** → [README.md](../README.md) + [PHASE4_QUICK_START.md](PHASE4_QUICK_START.md)
- **Understand the architecture** → [ARCHITECTURE_REVIEW.md](ARCHITECTURE_REVIEW.md) + [COMPLETE_IMPLEMENTATION_REPORT.md](COMPLETE_IMPLEMENTATION_REPORT.md)
- **Run and manage containers** → [PRODUCTION_OPERATIONS.md](PRODUCTION_OPERATIONS.md) + [PRODUCTION_RUNBOOKS.md](PRODUCTION_RUNBOOKS.md)
- **Fix git sync issues** → [SESSION_GIT_SYNC_FIX_SUMMARY.md](SESSION_GIT_SYNC_FIX_SUMMARY.md) + [VAULTY_GIT_SYNC_TROUBLESHOOTING.md](VAULTY_GIT_SYNC_TROUBLESHOOTING.md)
- **Set up code formatting** → [PRETTIER_SETUP.md](PRETTIER_SETUP.md)
- **Work with pipelines** → [PIPELINE_ENGINE.md](PIPELINE_ENGINE.md) + [PIPELINE_ENGINE_QUICK_REF.md](PIPELINE_ENGINE_QUICK_REF.md)
- **Manage tasks & dependencies** → [TASK_DEPENDENCY_GRAPH_QUICK_REF.md](TASK_DEPENDENCY_GRAPH_QUICK_REF.md)
- **Run tests & verify** → [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) + [TEST_IMPLEMENTATION_SUMMARY.md](TEST_IMPLEMENTATION_SUMMARY.md)

---

## 📁 Documentation by Category

### 🚀 Getting Started & Current Status

| Document                                                           | Purpose                                           | Last Updated     |
| ------------------------------------------------------------------ | ------------------------------------------------- | ---------------- |
| [README.md](../README.md)                                          | Main project overview                             | Latest           |
| [SESSION_GIT_SYNC_FIX_SUMMARY.md](SESSION_GIT_SYNC_FIX_SUMMARY.md) | Latest session: git sync fix & bidirectional sync | Dec 18, 2025 ✅  |
| [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)           | Project completion status                         | Phase 4 Complete |
| [PHASE4_QUICK_START.md](PHASE4_QUICK_START.md)                     | Phase 4 quick start guide                         | Phase 4          |
| [PRODUCTION_OPERATIONS.md](PRODUCTION_OPERATIONS.md)               | Production operations guide                       | Latest           |

### 🏗️ Architecture & System Design

| Document                                                               | Purpose                                                   |
| ---------------------------------------------------------------------- | --------------------------------------------------------- |
| [ARCHITECTURE_REVIEW.md](ARCHITECTURE_REVIEW.md)                       | Complete architecture analysis (10/14 issues fixed = 71%) |
| [COMPLETE_IMPLEMENTATION_REPORT.md](COMPLETE_IMPLEMENTATION_REPORT.md) | Full platform overview (26KB detailed report)             |
| [KNOWLEDGE_GRAPH.md](KNOWLEDGE_GRAPH.md)                               | System knowledge graph & relationships                    |
| [BRANCH_STRUCTURE.md](BRANCH_STRUCTURE.md)                             | Git branch organization                                   |

### 🔄 Vault & Sync Operations

| Document                                                                   | Purpose                                    |
| -------------------------------------------------------------------------- | ------------------------------------------ |
| [SESSION_GIT_SYNC_FIX_SUMMARY.md](SESSION_GIT_SYNC_FIX_SUMMARY.md)         | Git sync fix details (Dec 18, 2025) ⭐ NEW |
| [VAULTY_GIT_SYNC_TROUBLESHOOTING.md](VAULTY_GIT_SYNC_TROUBLESHOOTING.md)   | Vaulty container troubleshooting           |
| [../apps/vaulty/SYNC_ENHANCEMENTS.md](../apps/vaulty/SYNC_ENHANCEMENTS.md) | Vaulty sync enhancements                   |
| [../apps/vaulty/README.md](../apps/vaulty/README.md)                       | Vaulty container documentation             |
| [SUPABASE_AUTH.md](SUPABASE_AUTH.md)                                       | Supabase authentication setup              |

### 🔧 Development & Testing

| Document                                                         | Purpose                                    |
| ---------------------------------------------------------------- | ------------------------------------------ |
| [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)                     | Test suite status & verification checklist |
| [TEST_IMPLEMENTATION_SUMMARY.md](TEST_IMPLEMENTATION_SUMMARY.md) | Test implementation details                |
| [VITEST_CONVERSION.md](VITEST_CONVERSION.md)                     | Vitest migration details                   |
| [VITEST_QUICK_REF.md](VITEST_QUICK_REF.md)                       | Vitest quick reference                     |
| [TESTING_GUIDE.md](TESTING_GUIDE.md)                             | Testing guide & best practices             |

### 📚 Core Features (Quick References)

| Document                                                                 | Purpose                                  |
| ------------------------------------------------------------------------ | ---------------------------------------- |
| [PIPELINE_ENGINE_QUICK_REF.md](PIPELINE_ENGINE_QUICK_REF.md)             | Pipeline workflows quick reference       |
| [OPERATION_JOURNAL_QUICK_REF.md](OPERATION_JOURNAL_QUICK_REF.md)         | Operation journal & undo quick reference |
| [TASK_DEPENDENCY_GRAPH_QUICK_REF.md](TASK_DEPENDENCY_GRAPH_QUICK_REF.md) | Task graph quick reference               |
| [SESSION_PLANNER_QUICK_REF.md](SESSION_PLANNER_QUICK_REF.md)             | Session planner quick reference          |
| [FILE_OPERATIONS_QUICK_REF.md](FILE_OPERATIONS_QUICK_REF.md)             | File operations quick reference          |

### 📖 Core Features (Detailed)

| Document                                                                     | Purpose                            |
| ---------------------------------------------------------------------------- | ---------------------------------- |
| [PIPELINE_ENGINE.md](PIPELINE_ENGINE.md)                                     | Pipeline implementation details    |
| [PIPELINE_IMPLEMENTATION_SUMMARY.md](PIPELINE_IMPLEMENTATION_SUMMARY.md)     | Pipeline implementation summary    |
| [OPERATION_JOURNAL.md](OPERATION_JOURNAL.md)                                 | Journal system architecture        |
| [STRUCTURE_SCHEMA_VALIDATION.md](STRUCTURE_SCHEMA_VALIDATION.md)             | Schema validation system           |
| [RECURRING_TEMPLATES.md](RECURRING_TEMPLATES.md)                             | Recurring template schema & usage  |
| [TEMPLATE_DISCOVERY_API.md](TEMPLATE_DISCOVERY_API.md)                       | Template discovery API             |
| [TEMPLATE_DISCOVERY_IMPLEMENTATION.md](TEMPLATE_DISCOVERY_IMPLEMENTATION.md) | Template discovery implementation  |
| [TEMPLATE_DISCOVERY_QUICK_REF.md](TEMPLATE_DISCOVERY_QUICK_REF.md)           | Template discovery quick reference |
| [DIFF_PREVIEW_API.md](DIFF_PREVIEW_API.md)                                   | Diff preview API                   |
| [DIFF_PREVIEW_IMPLEMENTATION.md](DIFF_PREVIEW_IMPLEMENTATION.md)             | Diff preview implementation        |
| [DIFF_PREVIEW_QUICK_REF.md](DIFF_PREVIEW_QUICK_REF.md)                       | Diff preview quick reference       |

### 🛠️ Setup & Configuration

| Document                                           | Purpose                                 |
| -------------------------------------------------- | --------------------------------------- |
| [PRETTIER_SETUP.md](PRETTIER_SETUP.md)             | Code formatting & pre-commit hook setup |
| [ENVIRONMENT_STRATEGY.md](ENVIRONMENT_STRATEGY.md) | Environment variable strategy           |
| [FIX_PLAN.md](FIX_PLAN.md)                         | Architecture improvements roadmap       |

### 📋 Phase Documentation (Historical)

| Phase       | Documents                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 1** | [PHASE1_COMPLETE.md](PHASE1_COMPLETE.md), [PHASE1_PROGRESS.md](PHASE1_PROGRESS.md), [PHASE1_COMPLETION_REPORT.md](PHASE1_COMPLETION_REPORT.md)                                                                                                                                                                                                                                                                               |
| **Phase 2** | [PHASE2_PLANNING.md](PHASE2_PLANNING.md), [PHASE2_PROGRESS.md](PHASE2_PROGRESS.md), [PHASE2_COMPLETION.md](PHASE2_COMPLETION.md), [PHASE2_START_SUMMARY.md](PHASE2_START_SUMMARY.md)                                                                                                                                                                                                                                         |
| **Phase 3** | [PHASE3_IMPLEMENTATION.md](PHASE3_IMPLEMENTATION.md), [PHASE3_QUICK_REF.md](PHASE3_QUICK_REF.md)                                                                                                                                                                                                                                                                                                                             |
| **Phase 4** | [PHASE4_COMPLETE_SUMMARY.md](PHASE4_COMPLETE_SUMMARY.md), [PHASE4_DETAILED_PLAN.md](PHASE4_DETAILED_PLAN.md), [PHASE4_KICKOFF.md](PHASE4_KICKOFF.md), [PHASE4_MASTER_CHECKLIST.md](PHASE4_MASTER_CHECKLIST.md), [PHASE4_PROJECT_STATUS.md](PHASE4_PROJECT_STATUS.md), [PHASE4_INTEGRATION_TESTING_COMPLETE.md](PHASE4_INTEGRATION_TESTING_COMPLETE.md), [PHASE4_TEST_COMPLETION_REPORT.md](PHASE4_TEST_COMPLETION_REPORT.md) |

### 🐛 Debugging & Troubleshooting

| Document                                                                 | Purpose                                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| [DOCKER_BUILD_FIX_TSCONFIG.md](DOCKER_BUILD_FIX_TSCONFIG.md)             | Docker/Podman build fix for missing tsconfig.base.json (Dec 18, 2025) ✅ |
| [GIT_PULL_AUTOSTASH_ENHANCEMENT.md](GIT_PULL_AUTOSTASH_ENHANCEMENT.md)   | Git pull --autostash enhancement for robust rebases (Dec 18, 2025) ✅    |
| [VAULTY_GIT_SYNC_TROUBLESHOOTING.md](VAULTY_GIT_SYNC_TROUBLESHOOTING.md) | Git sync troubleshooting                                                 |
| [BASE64_DEBUG_FIX.md](BASE64_DEBUG_FIX.md)                               | Base64 encoding fixes                                                    |
| [LEGACY_SCRIPTS_ANALYSIS.md](LEGACY_SCRIPTS_ANALYSIS.md)                 | Legacy scripts analysis                                                  |

### 📊 Summaries & Reports

| Document                                                               | Purpose                       |
| ---------------------------------------------------------------------- | ----------------------------- |
| [COMPLETE_PLATFORM_SUMMARY.txt](COMPLETE_PLATFORM_SUMMARY.txt)         | Complete platform summary     |
| [TASK_DEPENDENCY_GRAPH_SUMMARY.txt](TASK_DEPENDENCY_GRAPH_SUMMARY.txt) | Task dependency graph summary |
| [REVIEW_SUMMARY.md](REVIEW_SUMMARY.md)                                 | Architecture review summary   |

---

## 🔗 Key File References by Location

### Core Application Files

- [apps/vaulty/src/git-sync.sh](../apps/vaulty/src/git-sync.sh) — Main sync orchestrator
- [apps/vaulty/src/vault-init.sh](../apps/vaulty/src/vault-init.sh) — Vault initialization
- [apps/vaulty/src/scripts/sync.py](../apps/vaulty/src/scripts/sync.py) — Python sync engine
- [apps/mcp/Dockerfile](../apps/mcp/Dockerfile) — MCP container build (fixed Dec 18, 2025)

### Test Files

- [**tests**/vaulty/vaulty-scripts.test.ts](__tests__/vaulty/vaulty-scripts.test.ts) — Vaulty tests (36/36 passing)

### Configuration Files

- [package.json](../package.json) — Project scripts & dependencies
- [pnpm-workspace.yaml](../pnpm-workspace.yaml) — Pnpm workspace config
- [tsconfig.base.json](../tsconfig.base.json) — TypeScript base config
- [vitest.config.base.ts](../vitest.config.base.ts) — Vitest base config

---

## 📍 Latest Session Summary

### December 18, 2025 - Git Sync Fix & Bidirectional Sync

**Status**: ✅ COMPLETE

**What was done**:

1. Fixed git sync failures in vaulty container
2. Implemented local-only git mode support
3. Added bidirectional volume sync (local ↔ container)
4. Added `has_remote()` detection function
5. Fixed GitHub PAT authentication format
6. Updated tests: 36/36 passing

**Key changes**:

- [apps/vaulty/src/scripts/sync.py](../apps/vaulty/src/scripts/sync.py) — Added has_remote() & local-only mode
- [apps/vaulty/src/git-sync.sh](../apps/vaulty/src/git-sync.sh) — Added bidirectional sync
- [apps/vaulty/src/vault-init.sh](../apps/vaulty/src/vault-init.sh) — Fixed PAT format & git validation

**Documentation**:

- [SESSION_GIT_SYNC_FIX_SUMMARY.md](SESSION_GIT_SYNC_FIX_SUMMARY.md) — Full session details ⭐

**Metrics**:

- ✅ Sync success rate: 0% → 100%
- ✅ Sync duration: 30s+ → ~72ms
- ✅ Status: "unhealthy" → "healthy"
- ✅ Test coverage: 31/36 → 36/36

---

## 🔄 Document Relationships

```
README.md (Main entry)
├── IMPLEMENTATION_COMPLETE.md (Status)
├── SESSION_GIT_SYNC_FIX_SUMMARY.md (Latest session ⭐)
│   ├── VAULTY_GIT_SYNC_TROUBLESHOOTING.md
│   ├── apps/vaulty/SYNC_ENHANCEMENTS.md
│   └── apps/vaulty/README.md
├── ARCHITECTURE_REVIEW.md (Design)
│   ├── COMPLETE_IMPLEMENTATION_REPORT.md
│   └── KNOWLEDGE_GRAPH.md
├── PRODUCTION_OPERATIONS.md (Ops)
│   └── PRODUCTION_RUNBOOKS.md
├── Core Features
│   ├── PIPELINE_ENGINE.md (+ Quick Ref)
│   ├── OPERATION_JOURNAL.md (+ Quick Ref)
│   ├── TASK_DEPENDENCY_GRAPH_QUICK_REF.md
│   ├── SESSION_PLANNER_QUICK_REF.md
│   └── STRUCTURE_SCHEMA_VALIDATION.md
├── Testing & Development
│   ├── TESTING_CHECKLIST.md
│   └── VITEST_QUICK_REF.md
└── Setup & Config
    ├── PRETTIER_SETUP.md
    └── ENVIRONMENT_STRATEGY.md
```

---

## 💡 How to Use This Index

1. **First Time**: Start with [README.md](../README.md)
2. **Check Status**: Read [SESSION_GIT_SYNC_FIX_SUMMARY.md](SESSION_GIT_SYNC_FIX_SUMMARY.md) for latest updates
3. **Learn System**: Read [ARCHITECTURE_REVIEW.md](ARCHITECTURE_REVIEW.md)
4. **Run Services**: Follow [PRODUCTION_OPERATIONS.md](PRODUCTION_OPERATIONS.md)
5. **Fix Issues**: Use troubleshooting guides like [VAULTY_GIT_SYNC_TROUBLESHOOTING.md](VAULTY_GIT_SYNC_TROUBLESHOOTING.md)
6. **Deep Dive**: Explore feature documentation (PIPELINE_ENGINE.md, OPERATION_JOURNAL.md, etc.)

---

## 📞 Need Help?

- **Quick answers**: Check the Quick Reference documents (ending in `_QUICK_REF.md`)
- **Detailed info**: Check the main documentation files
- **Troubleshooting**: Use the troubleshooting guides
- **Latest updates**: See [SESSION_GIT_SYNC_FIX_SUMMARY.md](SESSION_GIT_SYNC_FIX_SUMMARY.md)
