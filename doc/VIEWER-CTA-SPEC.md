# Viewer CTA + API Spec

## Context

- `apps/viewer/src/pages/index.jsx` is the home/hero page for the viewer. It already fetches:
  - `/api/v1/notes` (to list and filter vault notes while respecting `_system`/config filters).
  - `/api/v1/tasks` (to populate `taskStats`, derive priority filters, and decorate cards).
  - `window.TASKER_API_URL` is injected by `apps/viewer/scripts/start.sh` so the SPA talks back to the Tasker API.
- The avatar dashboard (`apps/viewer/src/pages/avatar.jsx` + `useAvatar`) fetches `/api/v1/cod/avatar`, `/api/v1/sessions/stats`, and `/api/v1/tasks` to show vitals, knowledge, and actions.
- Right now the hero CTA (`View Tasks`, `Goal Progress`, the avatar action buttons) are static navigation links or refresh triggers; none explicitly reflect the live API data they already consume.

## Objective

Make the hero CTA area (including the avatar quick actions) explicitly rely on the Tasker API so that:

1. The primary action surfaces live metrics (active tasks, high-priority counts) and clearly links to the Tasker-powered task exploration experience.
2. Secondary actions (Goals, Avatar) display API-backed badges/counts and degrade gracefully when the API is unreachable.
3. The call-to-action copy, styles, and accessibility hints reflect the API state (e.g., “Sync Vitals ● API Connected / Offline”).

## Requirements

1. **CTA data binding**
   - Use the `taskStats` and `goalsCount` derived from `/api/v1/tasks` to teach the CTA what counts it reflects.
   - Display the count on the “View Tasks” button (e.g., `View Tasks (12 active)`), update the label when `taskStats.highPriority > 0`.
   - For goals, show `goalsCount` so the user knows how many goal notes are available via Tasker.

2. **API health indicator**
   - Track whether the latest fetch/session succeeded and show a small badge/tooltip in the CTA area (hero or avatar) that says “Tasker API online” or “API offline / using cache”.
   - The Avatar quick action “Sync Vitals” should reflect whether the API call is pending or failed (e.g., disable while fetching, show spinner/text).

3. **Behavior and fallbacks**
   - When `window.TASKER_API_URL` is undefined or the fetch fails, fall back to the existing Gatsby-driven list and display `0` counts with a tooltip explaining the API is unreachable.
   - Keep `Link to="/avatar"` and `Link to="/goals"` navigation targets but pair them with the API-aware badges described above.
   - Document the injection of `TASKER_API_URL` in `apps/viewer/scripts/start.sh` so the viewer builds for public release without secrets.

4. **Documentation**
   - Mention in `doc/VIEWER-CTA-SPEC.md` why these CTA updates are critical for public release (non-LLM crowd needs trust in API counts).
   - Call out relevant files (`index.jsx`, `useAvatar.js`, `scripts/start.sh`) so future work can land there.

## Acceptance

- CTA buttons display API counts and health badges once the API responds.
- The hero/quick-link area prioritizes Tasker API data without breaking when the API is offline.
- Spec file lives under `doc/VIEWER-CTA-SPEC.md` to guide subsequent implementation.

## Next Steps (for next LLM or follow-on work)

1. Build the UI adjustments described above, starting with the hero CTA component and linking to the API counts.
2. Add automated smoke coverage (manual or visual diff) verifying those counts render based on mocked API responses.
3. Confirm the existing avatar quick actions pick up the same health indicators.
