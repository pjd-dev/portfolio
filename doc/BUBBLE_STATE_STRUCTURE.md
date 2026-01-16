# Bubble State (formerly World) Structure

## Overview

**Bubble** = Environmental/contextual state that constrains task execution (location, connectivity, noise, focus availability, etc.)

**Note:** Terminology change: `world` → `bubble` for better semantic clarity

## Core Structure

### 1. **Bubble State Note** (`core/bubble/Bubble.md`)

```yaml
---
type: bubble
id: primary
updated: 2026-01-16T12:00:00Z

# Context: Current environmental/situational facts
context:
  location: "home"           # Physical location
  time_of_day: "morning"     # Time period
  energy_level: "high"       # User energy state
  noise_level: "low"         # Ambient noise
  connectivity: "good"       # Network status
  interruptions: "none"      # Distraction level

# Signals: Real-time environmental inputs
signals:
  wifi_available: true
  phone_silent: true
  door_locked: false
  focus_mode_active: true

# Constraints: Rules about what can execute in this bubble
constraints:
  tagsBlocked: ["travel", "meetings"]  # Tasks tagged with these are blocked
  tagsRequiredAny: ["home"]            # Task must have at least one of these tags
  tagsRequiredAll: []                  # Task must have all of these tags

  # Contextual constraints (matched by constraint field)
  connectivity: "good"                 # Require good connectivity
  location: "home"                     # Must be at home

# Resources: Available tools/assets in this bubble
resources:
  devices: ["laptop", "phone", "headphones"]
  apps: ["slack", "vscode", "obsidian"]
  time_blocks: 4                       # Available focus blocks

# Cycles: Time-based patterns
cycles:
  day_type: "work_day"                 # Type of day
  season: "winter"
  week_phase: "mid_week"

# Flags: Boolean toggles
flags:
  in_do_not_disturb: false
  on_vacation: false
  health_compromised: false
---

# Bubble State
Current environmental context and constraints for task planning.

## Current Environment
- Location: Home office
- Time: Morning (high focus)
- Connectivity: Good WiFi
- Interruptions: None (focus mode active)

## Available Time
- 4 focus blocks (90 min each) available today
- Morning: 2 blocks (peak focus)
- Afternoon: 1 block (declining focus)
- Evening: 1 block (low focus)
```

### 2. **Task-Level Bubble Requirements** (`tasks/*.md`)

Tasks specify what bubble conditions they need:

```yaml
---
type: task
id: deep_work_task
title: Implement feature X

# Option 1: Inline bubble requirements
bubble_requires:
  tagsRequired: ['focus:deep', 'location:home']
  constraints:
    connectivity: 'good'
    energy_level: 'high'

# Option 2: Separate world field (legacy, but supported)
world:
  requires:
    tagsAny: ['home']
    tagsAll: ['deep']
    constraints:
      connectivity: 'good'

# Option 3: Minimal - just tags
tags: ['deep', 'async']


# avatar_rewards: ...
# status: todo
---
```

## Constraint Matching Logic

### Tag Matching

```
Task:       bubble_requires.tagsRequired = ["deep", "home"]
Bubble:     constraints.tagsRequiredAny = ["home"]

Match?
- Task needs both "deep" AND "home"
- Bubble requires at least "home"
- ✅ YES - task can execute
```

### Contextual Matching

```
Task:       bubble_requires.constraints = { connectivity: "good" }
Bubble:     context = { connectivity: "good" }

Match?
- Task needs connectivity="good"
- Bubble has connectivity="good"
- ✅ YES - task can execute
```

### Blocking Tags

```
Task:       tags = ["travel"]
Bubble:     constraints.tagsBlocked = ["travel", "meetings"]

Blocked?
- Task has "travel" tag
- Bubble has "travel" in blockedTags
- ❌ NO - task is blocked
```

## Current Implementation

### WorldSimulationService

- **File:** `apps/mcp/src/services/world-simulation.service.ts`
- **Function:** `simulate(input)` → `WorldSimulationResult`
- **Status:** ✅ Detects bubble-blocked tasks
- **Usage:** Standalone validation, reports which tasks are blocked

```typescript
type WorldConstraintResult = {
  task: { id; title; path; tags };
  dependencyBlocked: boolean;
  worldBlocked: boolean; // ← Current detection
  reasons: string[];
};
```

### WorldService

- **File:** `apps/mcp/src/services/world.service.ts`
- **Function:** `loadWorldState(pathOverride)` → `WorldLoadResult`
- **Status:** ✅ Loads and normalizes bubble state

## What's Missing

### In COD Task Ranking

- ❌ **COD doesn't read bubble state**
- ❌ **No bubble constraint checking during scoring**
- ❌ **No penalty/filtering based on bubble status**

**Example Problem:**

```
Bubble context:     location="office"
Task requires:      location="home"
Current result:     Task ranks normally ❌ WRONG
Expected result:    Task should be penalized/excluded ✅
```

## Terminology Mapping (world → bubble)

| Current                   | New                       | Meaning              |
| ------------------------- | ------------------------- | -------------------- |
| `World.md`                | `Bubble.md`               | State note           |
| `WorldState`              | `BubbleState`             | Type definition      |
| `worldService`            | `bubbleService`           | Service class        |
| `world_requires`          | `bubble_requires`         | Task field           |
| `world.requires`          | `bubble.requires`         | Task field (variant) |
| `WorldSimulationService`  | `BubbleSimulationService` | Constraint validator |
| `world-simulation.ts`     | `bubble-simulation.ts`    | File                 |
| `constraints.tagsBlocked` | `constraints.tagsBlocked` | Same (no change)     |

## Key Concepts

### Bubble Properties (What defines the bubble)

- **Context:** Current facts (location, time, energy, noise, connectivity)
- **Signals:** Real-time inputs (wifi, phone_silent, focus_mode)
- **Constraints:** Rules that block/require certain tasks
- **Resources:** Available tools/time
- **Cycles:** Time-based patterns (day type, season)
- **Flags:** Boolean toggles (vacation, do_not_disturb)

### Task Requirements (What a task needs)

- **tagsRequired:** Task must have these tags
- **tagsRequired (bubble):** Task requires bubble to have these tags
- **tagsBlocked (bubble):** Bubble can't have these tags
- **constraints:** Task needs specific bubble context values
- **tagsAny/tagsAll:** Alternative constraint syntax

## Integration Points

### ✅ Already Implemented

1. `WorldSimulationService` - Detects bubble-blocked tasks
2. `WorldService` - Loads bubble state from notes
3. Task frontmatter supports `bubble_requires` / `world` fields

### ❌ Needs Implementation

1. **COD Integration** - Rank tasks with bubble factor
2. **Terminology** - Rename world → bubble throughout codebase
3. **Scoring** - Apply bubble penalty/filter in task ranking
4. **Documentation** - Examples of bubble_requires in practice

## Next Steps

See task: `enhancements/bubble-constraint-enforcement.md`

- Rename world → bubble for coherence
- Add bubble constraint loading to COD task ranking
- Implement applyBubbleConstraintPenalty() in scoring
- Write tests and documentation
