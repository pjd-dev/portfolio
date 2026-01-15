/**
 * Avatar workload gating service
 * Provides workload checking for COD gating without direct dependencies on MCP
 */

export type WorkloadGatingResult = {
  blocked: boolean;
  reason?: string;
  workloadToday: number;
  threshold: number;
  date: string;
};

export type AvatarFreshnessResult = {
  stale: boolean;
  age?: number;
  lastUpdate?: string;
  reason?: string;
};

export interface AvatarWorkloadService {
  /**
   * Check if workload threshold exceeded for given date
   */
  checkWorkloadGating(
    date: Date,
    threshold?: number
  ): Promise<WorkloadGatingResult>;

  /**
   * Check avatar vitals freshness (timezone-aware)
   */
  getAvatarFreshness(timezone?: string): Promise<AvatarFreshnessResult>;

  /**
   * Get workload by day (for diagnostics)
   */
  getWorkloadByDay(): Promise<Record<string, number>>;
}

/**
 * No-op implementation for environments without avatar tracking
 */
export class NoOpAvatarWorkloadService implements AvatarWorkloadService {
  async checkWorkloadGating(
    date: Date,
    threshold = 20
  ): Promise<WorkloadGatingResult> {
    const dateStr = date.toISOString().slice(0, 10);
    return {
      blocked: false,
      workloadToday: 0,
      threshold,
      date: dateStr,
    };
  }

  async getAvatarFreshness(): Promise<AvatarFreshnessResult> {
    return {
      stale: false,
    };
  }

  async getWorkloadByDay(): Promise<Record<string, number>> {
    return {};
  }
}
