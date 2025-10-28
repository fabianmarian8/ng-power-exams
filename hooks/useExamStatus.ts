/**
 * Custom React Hook for Exam Status
 *
 * Provides real-time exam status monitoring
 */

import { useState, useEffect, useCallback } from 'react';
import { ExamGuide } from '../types';
import { examService, ExamStatusCheck } from '../services/examService';

export interface UseExamStatusResult {
  guides: ExamGuide[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  checkBoard: (boardId: string) => Promise<ExamStatusCheck>;
}

export function useExamStatus(): UseExamStatusResult {
  const [guides, setGuides] = useState<ExamGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await examService.fetchExamStatuses();
      setGuides(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error fetching exam statuses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    examService.clearCache();
    await fetchStatuses();
  }, [fetchStatuses]);

  const checkBoard = useCallback(async (boardId: string): Promise<ExamStatusCheck> => {
    try {
      return await examService.checkExamBoard(boardId);
    } catch (err) {
      console.error(`Error checking board ${boardId}:`, err);
      throw err;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = examService.subscribe((updatedGuides) => {
      setGuides(updatedGuides);
    });

    return unsubscribe;
  }, []);

  return {
    guides,
    loading,
    error,
    refresh,
    checkBoard,
  };
}

/**
 * Hook for monitoring a specific exam board
 */
export function useMonitorExamBoard(boardId: string) {
  const [status, setStatus] = useState<ExamStatusCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const startMonitoring = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initial check
        const initialStatus = await examService.checkExamBoard(boardId);
        setStatus(initialStatus);

        // Start monitoring
        unsubscribe = await examService.monitorPortal(boardId, (updatedStatus) => {
          setStatus(updatedStatus);
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to monitor exam board'));
        console.error(`Error monitoring ${boardId}:`, err);
      } finally {
        setLoading(false);
      }
    };

    startMonitoring();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [boardId]);

  return {
    status,
    loading,
    error,
  };
}

/**
 * Hook for checking portal availability
 */
export function usePortalAvailability(portalUrl: string) {
  const [online, setOnline] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    try {
      setChecking(true);
      const isOnline = await examService.checkPortalOnline(portalUrl);
      setOnline(isOnline);
      return isOnline;
    } catch (err) {
      console.error('Error checking portal:', err);
      setOnline(false);
      return false;
    } finally {
      setChecking(false);
    }
  }, [portalUrl]);

  useEffect(() => {
    check();

    // Check every 5 minutes
    const interval = setInterval(check, 300000);

    return () => clearInterval(interval);
  }, [check]);

  return {
    online,
    checking,
    check,
  };
}
