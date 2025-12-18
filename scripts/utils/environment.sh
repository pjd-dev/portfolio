#!/usr/bin/env bash

################################################################################
# Environment Cache Utility
# Performance Optimization: Caches environment variables for improved performance
#
# Usage: source scripts/utils/environment.sh
#        load_environment_cached
################################################################################

set -euo pipefail

# ============================================================================
# Environment Cache
# ============================================================================

_ENV_CACHE_LOADED=0

##############################################################################
# Load Environment with Caching
##############################################################################

load_environment_cached() {
    # Check if already loaded
    if [[ $_ENV_CACHE_LOADED -eq 1 ]]; then
        return 0  # Already cached in memory
    fi
    
    # Load environment from production config
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
    source "${SCRIPT_DIR}/config/production.env" 2>/dev/null || true
    
    # Mark as loaded
    _ENV_CACHE_LOADED=1
}

# Export function for use in subscripts
export -f load_environment_cached

# Call on import
load_environment_cached
