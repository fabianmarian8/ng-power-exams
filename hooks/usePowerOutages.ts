/**
 * Custom React Hook for Power Outages
 *
 * Provides real-time power outage data with automatic updates
 */

import { useState, useEffect, useCallback } from 'react';
import { PowerOutage, OutageType, SourceType } from '../types';
import { powerOutageService, OutageFilter } from '../services/powerOutageService';

export interface UsePowerOutagesResult {
  outages: PowerOutage[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  clearCache: () => void;
}

export function usePowerOutages(filter?: OutageFilter): UsePowerOutagesResult {
  const [outages, setOutages] = useState<PowerOutage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOutages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await powerOutageService.fetchPowerOutages();

      // Apply filters if provided
      const filtered = filter
        ? powerOutageService.filterOutages(data, filter)
        : data;

      setOutages(filtered);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error fetching power outages:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const refresh = useCallback(async () => {
    powerOutageService.clearCache();
    await fetchOutages();
  }, [fetchOutages]);

  const clearCache = useCallback(() => {
    powerOutageService.clearCache();
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOutages();
  }, [fetchOutages]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = powerOutageService.subscribe((updatedOutages) => {
      const filtered = filter
        ? powerOutageService.filterOutages(updatedOutages, filter)
        : updatedOutages;

      setOutages(filtered);
    });

    return unsubscribe;
  }, [filter]);

  return {
    outages,
    loading,
    error,
    refresh,
    clearCache,
  };
}

/**
 * Hook for submitting user reports
 */
export function useSubmitOutageReport() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(async (outage: Omit<PowerOutage, 'id' | 'sourceType'>) => {
    try {
      setSubmitting(true);
      setError(null);

      const result = await powerOutageService.submitUserReport(outage);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit report');
      setError(error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    submit,
    submitting,
    error,
  };
}

/**
 * Hook for updating outage status
 */
export function useUpdateOutage() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(async (id: string, updates: Partial<PowerOutage>) => {
    try {
      setUpdating(true);
      setError(null);

      const result = await powerOutageService.updateOutage({ id, ...updates });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update outage');
      setError(error);
      throw error;
    } finally {
      setUpdating(false);
    }
  }, []);

  return {
    update,
    updating,
    error,
  };
}
