#!/usr/bin/env bash
# automation_state.sh - helper for shared automation state updates
# Must be sourced, not executed directly.

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "[automation-state] automation_state.sh must be sourced" >&2
  exit 1
fi

automation_state_resolve_path() {
  local root
  local shared_mount

  if [[ -n "${AUTOMATION_STATE_PATH:-}" ]]; then
    echo "$AUTOMATION_STATE_PATH"
    return
  fi

  shared_mount="${SHARED_MOUNT:-}"
  if [[ -n "$shared_mount" ]]; then
    echo "${shared_mount%/}/_automation-state.json"
    return
  fi

  root="${AUTOMATION_STATE_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
  echo "$root/dump/_automation-state.json"
}

automation_state_update() {
  local section="${1:-}"
  local payload="${2:-{}}"
  local state_path

  if [[ -z "$section" ]]; then
    return 0
  fi

  if ! command -v python3 >/dev/null 2>&1; then
    return 0
  fi

  state_path="$(automation_state_resolve_path)"

  python3 - "$state_path" "$section" "$payload" <<'PY' || true
import json
import os
import sys
from datetime import datetime
from pathlib import Path

path = Path(sys.argv[1])
section = sys.argv[2]
payload_raw = sys.argv[3] if len(sys.argv) > 3 else "{}"

try:
    payload = json.loads(payload_raw) if payload_raw else {}
except json.JSONDecodeError:
    payload = {}

state = {}
if path.exists():
    try:
        state = json.loads(path.read_text())
    except Exception:
        state = {}

if not isinstance(state, dict):
    state = {}

now = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
state.setdefault("version", 1)
state["updated_at"] = now
state.setdefault("mcp", {})
state.setdefault("healthcheck", {})
state.setdefault("smoke", {})

section_state = state.get(section, {})
if not isinstance(section_state, dict):
    section_state = {}
section_state.update(payload)
state[section] = section_state

path.parent.mkdir(parents=True, exist_ok=True)
tmp_path = path.with_suffix(path.suffix + ".tmp")
tmp_path.write_text(json.dumps(state, indent=2, sort_keys=False))
os.replace(tmp_path, path)
PY
}
