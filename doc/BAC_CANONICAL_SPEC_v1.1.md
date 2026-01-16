# BAC (Bubble-Avatar-COD) Canonical Spec v1.1.0

**Status:** Draft  
**Created:** 2026-01-16  
**Purpose:** Unified data model merging vault YAML schemas with BAC v1.1.0 TypeScript types

---

## Overview

This spec defines the **canonical data shape** for Bubble-Avatar-COD integration, bridging:

- **Vault storage** (YAML frontmatter in Obsidian notes)
- **Runtime types** (TypeScript interfaces for COD/MCP services)
- **Existing tools** (MCP tools, world simulation, avatar rewards)

---

## 1. Bubble State (formerly World)

### Vault Storage: `core/bubble/Bubble.md`

```yaml
---
type: bubble
id: primary
version: "1.1.0"
updated: 2026-01-16T12:00:00Z

# Context: where/when we are
context:
  timezone: America/New_York
  now: 2026-01-16T12:00:00Z
  location:
    type: home              # home | office | coworking | transit | travel | unknown
    label: "Home Office"
    geo:
      lat: 45.5017
      lon: -73.5673
      accuracyM: 100
  social:
    mode: alone            # alone | withPeople | meeting | public | unknown
    notes: "Focus mode active"

# Hard constraints: cannot be violated when hard=true
constraints:
  - id: constraint-rent-deadline
    type: time             # time | budget | legal | physical | dependency | policy | commitment | safety
    label: "Rent due Jan 31"
    hard: true
    window:
      start: 2026-01-31T00:00:00Z
      end: 2026-01-31T23:59:59Z
    limit:
      unit: days
      value: 0
    severity: 5            # 1-5 scale
    confidence: 100        # 0-100%
    source: bank
    notes: "Auto-debit on file"

  - id: constraint-budget-jan
    type: budget
    label: "January spending cap"
    hard: false            # soft constraint - can be violated with penalty
    limit:
      unit: eur
      value: 1500
    severity: 3
    confidence: 80
    notes: "Target to stay under rent threshold"

  # Legacy support: tag-based blocking
  tagsBlocked: [travel, meetings]     # tasks with these tags are blocked
  tagsRequiredAny: [home]             # task must have at least one of these
  tagsRequiredAll: []                 # task must have all of these

# Soft signals: uncertain info that affects decisions
signals:
  - id: signal-weather-snow
    type: environment      # deadline | availability | obligation | risk | opportunity | finance | environment | relationship | health | noise | interrupt
    label: "Snow forecast today"
    window:
      start: 2026-01-16T08:00:00Z
      end: 2026-01-16T20:00:00Z
    value:
      type: snow
      accumulation: 15cm
    severity: 2
    confidence: 75
    source: weather-api
    notes: "May affect commute if needed"

  - id: signal-invoice-pending
    type: finance
    label: "Client invoice pending"
    value:
      amount: 2500
      currency: eur
      expectedDate: 2026-01-20
    severity: 3
    confidence: 60
    source: email
    notes: "Follow-up needed"

# Time map: schedule blocks + deadlines
time:
  today: 2026-01-16
  scheduleBlocks:
    - id: block-morning-deep
      start: 2026-01-16T09:00:00Z
      end: 2026-01-16T12:00:00Z
      label: "Morning deep work"
      type: deep           # deep | shallow | meeting | admin | rest | unknown
      interruptibility: 10  # 0-100, 0=do not interrupt
      energyFit:
        min: 60
        max: 100
      focusFit:
        min: 70
        max: 100
      notes: "Peak focus window"

    - id: block-afternoon-shallow
      start: 2026-01-16T14:00:00Z
      end: 2026-01-16T17:00:00Z
      label: "Afternoon admin/shallow"
      type: shallow
      interruptibility: 60
      energyFit:
        min: 40
        max: 70
      focusFit:
        min: 30
        max: 60

  deadlines:
    - id: deadline-proposal
      label: "Submit proposal to client"
      due: 2026-01-18T17:00:00Z
      severity: 4
      confidence: 95
      source: calendar
      notes: "Soft deadline, some flex"

# Open loops: unfinished business across domains
openLoops:
  - id: loop-invoice-followup
    label: "Follow up on Dec invoice"
    domain: money          # work | money | health | people | home | learning | admin | unknown
    status: pending        # pending | waiting | blocked | stale
    nextStepHint: "Send reminder email"
    due: 2026-01-17T12:00:00Z
    severity: 3
    confidence: 90
    source: accounting-tool

  - id: loop-tax-prep
    label: "Q1 tax prep documentation"
    domain: admin
    status: blocked
    nextStepHint: "Wait for bank statements"
    severity: 2
    confidence: 80

# Resources available in bubble right now
resources:
  money:
    currency: eur
    available: 1200
    reserved: 300          # rent + bills
    confidence: 100
    updatedAt: 2026-01-16T08:00:00Z

  toolsAvailable:
    - id: tool-laptop
      label: "MacBook Pro"
      type: tool
      notes: "Primary workstation"
    - id: tool-vscode
      label: "VS Code"
      type: tool
    - id: tool-figma-license
      label: "Figma Pro"
      type: credential
      notes: "Active subscription"

  peopleAvailable:
    - id: person-mentor
      label: "Tech mentor"
      relationship: friend
      channel: slack
      availability: later
      notes: "Available for 30min call this week"

  environment:
    noise: 15              # 0-100, 0=quiet 100=chaos
    interruptionsLikely: 20 # 0-100
    mobility: 90           # 0=stuck 100=free to move
    internetQuality: 95
    deviceAccess:
      laptop: true
      phone: true
      secondMonitor: false
    notes: "Home office, optimal conditions"

# Risk surface
risk:
  hazards:
    - id: risk-income-gap
      label: "No new contracts in pipeline"
      type: financial      # financial | reputation | health | relationship | legal | security | unknown
      likelihood: 70
      impact: 80
      window:
        start: 2026-02-01T00:00:00Z
        end: 2026-03-01T00:00:00Z
      mitigations:
        - "Active job search"
        - "Networking outreach"
      confidence: 75

  uncertainty:
    overall: 40            # 0=certain 100=fog
    causes:
      - "Client payment timing unclear"
      - "Market conditions uncertain"

# Imposed objectives (external obligations)
imposedObjectives:
  - id: objective-rent
    label: "Pay rent by Jan 31"
    due: 2026-01-31T23:59:59Z
    severity: 5
    confidence: 100

  - id: objective-tax-filing
    label: "Q4 2025 tax filing"
    due: 2026-04-15T23:59:59Z
    severity: 4
    confidence: 100

---

# Bubble State

Current environmental context and constraints.

## Summary
- Location: Home office (Montreal, quiet, good internet)
- Time: Morning deep work block available (9-12)
- Key constraint: Rent due Jan 31 (hard deadline)
- Open loops: Invoice follow-up, tax prep blocked
- Risk: Income gap starting Feb 1
```

### TypeScript Runtime Type

```typescript
export interface BubbleModel {
  kind: 'Bubble';
  version: '1.1.0';
  updatedAt: ISODateTime;

  context: {
    timezone: string;
    now: ISODateTime;
    location?: {
      type: LocationType;
      label?: string;
      geo?: { lat: number; lon: number; accuracyM?: number };
    };
    social?: {
      mode: SocialContext;
      notes?: string;
    };
  };

  constraints: Array<{
    id: ID;
    type: BubbleConstraintType;
    label: string;
    hard: boolean;
    window?: { start?: ISODateTime; end?: ISODateTime };
    limit?: { unit: string; value: number };
    dependsOn?: ID[];
    source?: Channel | string;
    severity: Severity;
    confidence: Confidence;
    notes?: string;
  }>;

  signals: Array<{
    id: ID;
    type: BubbleSignalType;
    label: string;
    window?: { start?: ISODateTime; end?: ISODateTime };
    value?: unknown;
    severity?: Severity;
    confidence: Confidence;
    source?: Channel | string;
    notes?: string;
  }>;

  time: {
    today: ISODate;
    scheduleBlocks: Array<{
      id: ID;
      start: ISODateTime;
      end: ISODateTime;
      label: string;
      type: 'deep' | 'shallow' | 'meeting' | 'admin' | 'rest' | 'unknown';
      interruptibility: Pct;
      energyFit?: { min?: Energy; max?: Energy };
      focusFit?: { min?: Focus; max?: Focus };
      notes?: string;
    }>;
    deadlines: Array<{
      id: ID;
      label: string;
      due: ISODateTime;
      severity: Severity;
      confidence: Confidence;
      source?: Channel | string;
      notes?: string;
    }>;
  };

  openLoops: Array<{
    id: ID;
    label: string;
    domain:
      | 'work'
      | 'money'
      | 'health'
      | 'people'
      | 'home'
      | 'learning'
      | 'admin'
      | 'unknown';
    status: 'pending' | 'waiting' | 'blocked' | 'stale';
    nextStepHint?: string;
    due?: ISODateTime;
    severity?: Severity;
    confidence: Confidence;
    source?: Channel | string;
    notes?: string;
  }>;

  resources: {
    money?: {
      currency: string;
      available: number;
      reserved?: number;
      confidence: Confidence;
      updatedAt?: ISODateTime;
    };
    toolsAvailable: Array<{
      id: ID;
      label: string;
      type?: InventoryItemType;
      notes?: string;
    }>;
    peopleAvailable?: Array<{
      id: ID;
      label: string;
      relationship?: string;
      channel?: Channel;
      availability?: 'now' | 'soon' | 'later' | 'unknown';
      notes?: string;
    }>;
    environment: {
      noise: Pct;
      interruptionsLikely: Pct;
      mobility: Pct;
      internetQuality?: Pct;
      deviceAccess?: {
        laptop?: boolean;
        phone?: boolean;
        secondMonitor?: boolean;
      };
      notes?: string;
    };
  };

  risk: {
    hazards: Array<{
      id: ID;
      label: string;
      type:
        | 'financial'
        | 'reputation'
        | 'health'
        | 'relationship'
        | 'legal'
        | 'security'
        | 'unknown';
      likelihood: Pct;
      impact: Pct;
      window?: { start?: ISODateTime; end?: ISODateTime };
      mitigations?: string[];
      confidence: Confidence;
    }>;
    uncertainty: {
      overall: Pct;
      causes?: string[];
    };
  };

  imposedObjectives?: Array<{
    id: ID;
    label: string;
    due?: ISODateTime;
    severity: Severity;
    confidence: Confidence;
  }>;
}
```

---

## 2. Avatar State

### Vault Storage: `core/avatar/Avatar.md`

```yaml
---
type: avatar
id: primary
version: "1.1.0"
updated: 2026-01-16T12:00:00Z

# Profile: identity + constants
profile:
  name: Darry
  handle: darry
  archetype: builder
  title: Vault Operator
  location: Montreal
  timezone: America/New_York
  locale: en-CA
  interests: [vaulty, systems, cod]

# Vitals: current state (0-100 scale)
vitals:
  asOf: 2026-01-16T12:00:00Z
  energy: 75             # current energy level
  focus: 80              # current focus capacity
  stress: 25             # current stress level
  sleepQuality: 70       # last night's sleep
  momentum: 60           # forward progress feeling
  burnoutRisk: 20        # burnout risk indicator
  health: 85             # general health
  needs:
    sleep: 70
    social: 50
    food: 80

# Skills: capabilities with confidence
skills:
  build:
    level: 7             # 0-10 scale
    confidence: 85       # 0-100%
    updatedAt: 2026-01-10T00:00:00Z
  design:
    level: 5
    confidence: 70
  marketing:
    level: 3
    confidence: 50
  writing:
    level: 6
    confidence: 75

# Inventory: tools/assets/resources
inventory:
  - id: inv-laptop
    type: tool
    label: MacBook Pro
    qty: 1
    meta:
      model: "M3 Max"
      year: 2024
    updatedAt: 2026-01-01T00:00:00Z

  - id: inv-figma-license
    type: credential
    label: Figma Pro License
    qty: 1
    meta:
      expires: 2026-12-31

  - id: inv-runway-days
    type: money
    label: Runway
    qty: 45
    meta:
      currency: eur
      burnRate: 1500
    updatedAt: 2026-01-16T08:00:00Z

# Progression: XP/level/streaks
progression:
  xp: 1250
  level: 5
  streakDays: 12
  streakUpdated: 2026-01-16

# Status flags
status:
  overload: false
  injured: false
  sick: false
  recoveryNeeded: false
  notes: "Healthy and productive"

# Baselines: normal operating ranges
baselines:
  asOf: 2026-01-01T00:00:00Z
  vitals:
    energy: 70
    focus: 75
    stress: 20
    sleepHours: 7.5
  focus:
    deepWorkMin: 180
    shallowWorkMin: 240

# Trends: recent changes (7-day window)
trends:
  asOf: 2026-01-16T00:00:00Z
  windowDays: 7
  vitals7d:
    energy: +5           # trend direction
    stress: -3
    sleepQuality: +10
  sleepHours7d: +0.5

# Capacity: limits for planning
capacity:
  asOf: 2026-01-16T08:00:00Z
  focusCostMax: 8        # max focus cost task can take
  effortScoreMax: 8      # max effort score
  timeBudgetMin: 360     # minutes available today

# Knowledge: domains + learning
knowledge:
  asOf: 2026-01-16T00:00:00Z
  domains:
    vaulty: 4            # 0-5 scale
    fastify: 3
    typescript: 4
    obsidian: 4
  learning:
    now: [vault-api, mcp-tools]
    next: [k8s, docker]
  gaps: [marketing, sales]

# Mutation log: recent changes
mutationLog:
  - id: mut-task-complete-123
    at: 2026-01-16T11:30:00Z
    reason: "Completed task: implement streak bonuses"
    delta:
      energy: -5
      focus: -10
      momentum: +5
    tags: [task-completion, reward]

  - id: mut-morning-check
    at: 2026-01-16T08:00:00Z
    reason: "Morning check-in"
    delta:
      energy: 75         # SET not delta
      focus: 80
      stress: 25
    tags: [human-state, morning-check]

---

# Avatar State

Personal capability and resource state.

## Current State
- Energy: 75% (good)
- Focus: 80% (high)
- Stress: 25% (low)
- Momentum: 60% (decent progress)
- Streak: 12 days

## Capacity Today
- Time budget: 6 hours
- Max effort: 8/10 tasks
- Max focus cost: 8/10

## Recent Activity
- Completed streak bonus implementation (+5 XP, -5 energy, +5 momentum)
- Morning check set baseline vitals
```

### TypeScript Runtime Type

```typescript
export interface AvatarModel {
  kind: 'Avatar';
  version: '1.1.0';
  updatedAt: ISODateTime;

  profile: {
    name: string;
    handle: string;
    archetype?: string;
    title?: string;
    location?: string;
    timezone: string;
    locale?: string;
    interests?: string[];
  };

  vitals: {
    asOf: ISODateTime;
    energy: Energy;
    focus: Focus;
    stress: Stress;
    sleepQuality?: Pct;
    momentum?: Pct;
    burnoutRisk?: Pct;
    health?: Pct;
    needs?: {
      sleep?: Pct;
      social?: Pct;
      food?: Pct;
    };
  };

  skills: Record<
    SkillKey,
    {
      level: number;
      confidence: Confidence;
      updatedAt?: ISODateTime;
    }
  >;

  inventory: Array<{
    id: ID;
    type: InventoryItemType;
    label: string;
    qty?: number;
    meta?: Record<string, unknown>;
    updatedAt?: ISODateTime;
  }>;

  progression: {
    xp: number;
    level: number;
    streakDays: number;
    streakUpdated: ISODate;
  };

  status: {
    overload?: boolean;
    injured?: boolean;
    sick?: boolean;
    recoveryNeeded?: boolean;
    notes?: string;
  };

  baselines?: {
    asOf: ISODateTime;
    vitals: Partial<AvatarModel['vitals']>;
    focus?: {
      deepWorkMin: number;
      shallowWorkMin: number;
    };
  };

  trends?: {
    asOf: ISODateTime;
    windowDays: number;
    vitals7d: Record<string, number>;
    sleepHours7d?: number;
  };

  capacity: {
    asOf: ISODateTime;
    focusCostMax: number;
    effortScoreMax: number;
    timeBudgetMin: number;
  };

  knowledge?: {
    asOf: ISODateTime;
    domains: Record<string, number>;
    learning?: {
      now?: string[];
      next?: string[];
    };
    gaps?: string[];
  };

  mutationLog?: Array<{
    id: ID;
    at: ISODateTime;
    reason: string;
    delta: Partial<AvatarModel['vitals']>;
    tags?: string[];
  }>;
}
```

---

## 3. Task Requirements (Bubble Constraints)

### Vault Storage: Task frontmatter

```yaml
---
type: task
id: task-deep-programming
title: Implement bubble constraint enforcement
priority: 7
status: todo

# Bubble requirements (v1.1.0)
bubble:
  requires:
    # Tag matching (legacy support)
    tagsAny: [home, office] # task works if ANY of these tags present in bubble
    tagsAll: [deep] # task works if ALL of these tags present

    # Constraint matching
    constraints:
      connectivity: good # bubble.resources.environment.internetQuality >= 70
      location: home # bubble.context.location.type === "home"
      noise: low # bubble.resources.environment.noise <= 30

    # Time block requirements
    timeBlock:
      type: deep # requires bubble.time.scheduleBlocks[].type === "deep"
      minMinutes: 90 # requires block with >= 90 min duration
      interruptibility: 20 # requires block.interruptibility <= 20

    # Resource requirements
    resources:
      minEnergy: 60 # avatar.vitals.energy >= 60
      minFocus: 70 # avatar.vitals.focus >= 70
      maxStress: 40 # avatar.vitals.stress <= 40
      maxNoise: 30 # bubble.resources.environment.noise <= 30
      maxInterruptions: 20 # bubble.resources.environment.interruptionsLikely <= 20
      tools: [laptop, vscode] # bubble.resources.toolsAvailable includes these
      people: [mentor] # bubble.resources.peopleAvailable includes these (optional)

# Task attributes
effortScore: 6
focusCost: 7
estimatedTimeMin: 120

# Leverage (for goal prioritization)
leverage:
  expectedImpact: 80 # high impact
  reversibility: 70 # fairly reversible
  optionality: 60 # creates some options
  confidence: 75

tags: [enhancement, cod, bubble-state, deep-work]
---
```

### Constraint Matching Logic

```typescript
// Pseudo-code for constraint checking
function checkBubbleConstraints(
  task: Task,
  bubble: BubbleModel,
  avatar: AvatarModel
): ConstraintResult {
  const violations: string[] = [];
  const warnings: string[] = [];
  let score = 1.0; // start at 100%

  // 1. Hard constraint violations (BLOCK)
  for (const constraint of bubble.constraints.filter((c) => c.hard)) {
    if (violatesConstraint(task, constraint)) {
      violations.push(`Hard constraint: ${constraint.label}`);
      score = 0; // BLOCKED
    }
  }

  // 2. Tag blocking (BLOCK)
  if (task.tags.some((tag) => bubble.constraints.tagsBlocked?.includes(tag))) {
    violations.push(`Task has blocked tag`);
    score = 0; // BLOCKED
  }

  // 3. Tag matching (PENALIZE)
  if (bubble.constraints.tagsRequiredAny?.length > 0) {
    if (
      !task.tags.some((tag) => bubble.constraints.tagsRequiredAny.includes(tag))
    ) {
      warnings.push(
        `Missing required tag (any of: ${bubble.constraints.tagsRequiredAny})`
      );
      score *= 0.5; // 50% penalty
    }
  }

  // 4. Time block fit (PENALIZE)
  if (task.bubble.requires.timeBlock) {
    const matchingBlock = findMatchingTimeBlock(
      bubble.time.scheduleBlocks,
      task.bubble.requires.timeBlock
    );
    if (!matchingBlock) {
      warnings.push(`No suitable time block available`);
      score *= 0.3; // 70% penalty
    }
  }

  // 5. Resource requirements (PENALIZE)
  if (task.bubble.requires.resources) {
    const { minEnergy, minFocus, maxStress, maxNoise, maxInterruptions } =
      task.bubble.requires.resources;

    if (minEnergy && avatar.vitals.energy < minEnergy) {
      warnings.push(
        `Insufficient energy (need ${minEnergy}, have ${avatar.vitals.energy})`
      );
      score *= 0.6;
    }

    if (minFocus && avatar.vitals.focus < minFocus) {
      warnings.push(
        `Insufficient focus (need ${minFocus}, have ${avatar.vitals.focus})`
      );
      score *= 0.6;
    }

    if (maxNoise && bubble.resources.environment.noise > maxNoise) {
      warnings.push(
        `Too noisy (max ${maxNoise}, current ${bubble.resources.environment.noise})`
      );
      score *= 0.7;
    }
  }

  // 6. Soft constraint violations (PENALIZE)
  for (const constraint of bubble.constraints.filter((c) => !c.hard)) {
    if (violatesConstraint(task, constraint)) {
      warnings.push(`Soft constraint: ${constraint.label}`);
      score *= 1 - constraint.severity / 10; // severity-based penalty
    }
  }

  return {
    allowed: score > 0,
    score,
    violations,
    warnings,
  };
}
```

---

## 4. COD Integration

### Goal with Leverage

```yaml
---
type: goal
id: goal-rent-stability
title: Achieve rent stability
priority: 10
due: 2026-01-31T23:59:59Z

# Goal attributes
domain: money
estimatedTotalMinutes: 14400 # ~10 days
successCriteria: 'Secure job with salary >= 55k EUR, start date before Feb 15'

# Dependencies
dependencies: [] # other goal IDs

# Requirements (same as task)
bubble:
  requires:
    resources:
      minEnergy: 50
      minFocus: 60
      maxStress: 60
    timeBlock:
      type: shallow # job hunting is shallow work
      minMinutes: 60

# Leverage metrics (for prioritization)
leverage:
  expectedImpact: 95 # extremely high impact
  reversibility: 30 # hard to reverse once started
  optionality: 80 # creates many options
  confidence: 70

tags: [goal, rent-stability, urgent, money]
---
```

### COD Policies

```yaml
---
type: config
id: cod-policies
version: '1.1.0'

policies:
  neverViolateHardConstraints: true

  capacityThresholds:
    minEnergyToWork: 30
    minFocusToDeepWork: 60
    maxStressToShip: 75

  defaultActionBudgetMinutes: 90
  maxConcurrentActions: 3

  # Bubble fit rules
  bubbleFit:
    maxNoiseForDeepWork: 30
    maxInterruptionsForDeepWork: 20
    requireTimeBlockTypeForDeepWork: deep

  # Leverage-based prioritization
  leverage:
    impactWeight: 0.4
    reversibilityWeight: 0.2
    optionalityWeight: 0.2
    confidenceWeight: 0.2

loop:
  mode: idle
  tickIntervalMinutes: 15
---
```

---

## 5. Migration Path

### Phase 1: Type Definitions (Now)

- Create TypeScript types in `packages/cod-core/src/types/bac-state.ts`
- Keep existing vault schemas compatible

### Phase 2: Service Layer Updates

- Update `WorldService` → `BubbleService`
- Add constraint/signal parsing
- Add leverage scoring to goal ranking

### Phase 3: MCP Tool Updates

- `obsidian_get_world_state` → `obsidian_get_bubble_state`
- Add `obsidian_evaluate_task_bubble_fit` tool
- Update task ranking tools to use leverage

### Phase 4: Vault Schema Migration

- Migrate `core/world/World.md` → `core/bubble/Bubble.md`
- Update task frontmatter: `world` → `bubble`
- Add leverage fields to goals

### Phase 5: COD Integration

- Update task ranking to use bubble constraints
- Implement leverage-based goal prioritization
- Add orientation checks (hard constraints, soft risks, capacity fit)

---

## 6. Backward Compatibility

### Legacy Field Mapping

| Legacy Field                              | v1.1.0 Field                             | Notes                   |
| ----------------------------------------- | ---------------------------------------- | ----------------------- |
| `world`                                   | `bubble`                                 | Direct rename           |
| `world.requires.tagsAny`                  | `bubble.requires.tagsAny`                | Keep for compatibility  |
| `world.requires.constraints.connectivity` | `bubble.requires.resources.connectivity` | Map to resources        |
| `avatar.stats`                            | `avatar.vitals`                          | Merge into vitals       |
| `avatar.xp`, `avatar.level`               | `avatar.progression`                     | Group under progression |

### Transition Period

- Support both `world` and `bubble` fields (6 months)
- Emit warnings when legacy fields detected
- Provide migration tool: `cod migrate-bac-v1.1`

---

## 7. Implementation Checklist

- [ ] Create TypeScript types in `packages/cod-core/src/types/bac-state.ts`
- [ ] Create parser/validator for bubble YAML → BubbleModel
- [ ] Update WorldService to BubbleService with v1.1.0 support
- [ ] Implement constraint checking with hard/soft logic
- [ ] Implement leverage scoring for goals
- [ ] Update MCP tools (get_bubble_state, evaluate_task_fit)
- [ ] Update COD task ranking to use bubble constraints
- [ ] Add orientation checks to COD decision loop
- [ ] Create migration script for vault notes
- [ ] Update documentation and examples
- [ ] Write tests for constraint matching logic
- [ ] Write tests for leverage scoring

---

## 8. Example Usage

### Scenario: Morning Planning

**Bubble State:** Home, morning, deep work block available, quiet, good internet  
**Avatar State:** Energy 75%, Focus 80%, Stress 25%

**Task A:** "Implement bubble constraints" (deep work, requires home, focus 70+)

- ✅ **Allowed** - All requirements met
- **Score:** 1.0 (100%)
- **Fit:** Perfect match for morning deep block

**Task B:** "Client meeting" (sync, tagged "meetings")

- 🚫 **Blocked** - Tag "meetings" in bubble.constraints.tagsBlocked
- **Score:** 0 (0%)
- **Reason:** Hard constraint violation

**Task C:** "Email admin" (shallow, can do anywhere)

- ⚠️ **Allowed but suboptimal** - No deep work requirement, but deep block available
- **Score:** 0.6 (60%)
- **Reason:** Better to use deep block for deep work

**Goal Ranking:**

1. **Rent Stability** (leverage: 95/30/80, priority 10) → **Top priority**
2. **Vaulty Features** (leverage: 70/80/60, priority 7) → **High optionality**
3. **Marketing Site** (leverage: 50/90/40, priority 5) → **Reversible, lower impact**

---

## Summary

This canonical spec unifies:

- ✅ Vault-native YAML storage (Obsidian-friendly)
- ✅ TypeScript runtime types (type-safe COD services)
- ✅ Rich constraint modeling (hard/soft, confidence, severity)
- ✅ Leverage-based prioritization (impact, reversibility, optionality)
- ✅ Backward compatibility with existing tools
- ✅ Clear migration path from v1.0 → v1.1

**Next Step:** Implement TypeScript types + constraint checking logic in Enhancement #2.
