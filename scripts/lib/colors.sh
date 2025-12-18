#!/usr/bin/env bash

# Color codes and formatting utilities
# Source this file to use color variables and formatting functions

# ============================================================================
# Color Codes
# ============================================================================

# Standard colors
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export MAGENTA='\033[0;35m'
export CYAN='\033[0;36m'
export WHITE='\033[0;37m'
export GRAY='\033[0;90m'

# Bright colors
export BRED='\033[1;31m'
export BGREEN='\033[1;32m'
export BYELLOW='\033[1;33m'
export BBLUE='\033[1;34m'
export BMAGENTA='\033[1;35m'
export BCYAN='\033[1;36m'
export BWHITE='\033[1;37m'

# Reset
export NC='\033[0m' # No Color
export RESET='\033[0m'

# ============================================================================
# Text Formatting
# ============================================================================

export BOLD='\033[1m'
export DIM='\033[2m'
export ITALIC='\033[3m'
export UNDERLINE='\033[4m'
export BLINK='\033[5m'
export REVERSE='\033[7m'
export HIDDEN='\033[8m'
export STRIKE='\033[9m'

# ============================================================================
# Background Colors
# ============================================================================

export BG_RED='\033[41m'
export BG_GREEN='\033[42m'
export BG_YELLOW='\033[43m'
export BG_BLUE='\033[44m'
export BG_MAGENTA='\033[45m'
export BG_CYAN='\033[46m'
export BG_WHITE='\033[47m'

# ============================================================================
# Emoji/Icons (if supported)
# ============================================================================

export ICON_SUCCESS='✓'
export ICON_ERROR='✗'
export ICON_WARN='⚠'
export ICON_INFO='ℹ'
export ICON_ARROW='→'
export ICON_CHECK='✔'
export ICON_CROSS='✘'
export ICON_STAR='★'
export ICON_CIRCLE='●'
export ICON_DIAMOND='◆'

# ============================================================================
# Color Functions
# ============================================================================

# Colorize text
color_text() {
  local color="$1"
  local text="$2"
  echo -e "${!color}${text}${NC}"
}

# Rainbow text (cycling through colors)
rainbow_text() {
  local text="$1"
  local colors=("RED" "YELLOW" "GREEN" "CYAN" "BLUE" "MAGENTA")
  local color_idx=0
  
  for ((i = 0; i < ${#text}; i++)); do
    echo -n -e "${!colors[$color_idx]}${text:$i:1}${NC}"
    ((color_idx = (color_idx + 1) % ${#colors[@]}))
  done
  echo ""
}

# Underline text
underline() {
  echo -e "${UNDERLINE}$1${NC}"
}

# Bold text
bold() {
  echo -e "${BOLD}$1${NC}"
}

# Colored bold
bold_color() {
  local color="$1"
  local text="$2"
  echo -e "${!color}${BOLD}${text}${NC}"
}

# Status badge
status_badge() {
  local status="$1"
  case "$status" in
    success|ok|pass)
      echo -e "${GREEN}${BOLD}[✓]${NC}"
      ;;
    error|fail)
      echo -e "${RED}${BOLD}[✗]${NC}"
      ;;
    warn|warning)
      echo -e "${YELLOW}${BOLD}[⚠]${NC}"
      ;;
    info)
      echo -e "${BLUE}${BOLD}[ℹ]${NC}"
      ;;
    *)
      echo -e "${GRAY}[?]${NC}"
      ;;
  esac
}

# ============================================================================
# Export functions
# ============================================================================

export -f color_text rainbow_text underline bold bold_color status_badge
