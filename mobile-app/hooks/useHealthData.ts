// ===========================================
// HOOK: useHealthData - Quản lý dữ liệu sức khỏe
// ===========================================

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { api, HealthDataResponse } from '../services/api';

// Dữ liệu mặc định khi chưa có dữ liệu
const DEFAULT_HEALTH_DATA: HealthDataResponse = {
  heartRate: {
    current: 0,
    min: 0,
    max: 0,
    avg: 0,
    resting: 0,
    lastMeasured: 'Chưa có dữ liệu',
    device: 'Chưa kết nối',
    trend: 'stable',
  },
  sleep: {
    duration: 0,
    quality: 0,
    deepSleep: 0,
    lightSleep: 0,
    remSleep: 0,
    awake: 0,
    bedTime: '--:--',
    wakeTime: '--:--',
    device: 'Chưa kết nối',
  },
  steps: {
    current: 0,
    goal: 10000,
    distance: 0,
    calories: 0,
  },
  water: {
    current: 0,
    goal: 2500,
  },
};

// Chart data mặc định (7 ngày)
export const DEFAULT_CHART_DATA = {
  heartRate: [0, 0, 0, 0, 0, 0, 0],
  sleep: [0, 0, 0, 0, 0, 0, 0],
  steps: [0, 0, 0, 0, 0, 0, 0],
};

interface UseHealthDataReturn {
  data: HealthDataResponse;
  chartData: typeof DEFAULT_CHART_DATA;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  isConnected: boolean;
}

/**
 * Hook để lấy và quản lý dữ liệu sức khỏe từ API
 * @returns { data, chartData, loading, error, refresh, isConnected }
 */
export function useHealthData(): UseHealthDataReturn {
  const [data, setData] = useState<HealthDataResponse>(DEFAULT_HEALTH_DATA);
  const [chartData, setChartData] = useState(DEFAULT_CHART_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Lấy dữ liệu sức khỏe từ API
      const response = await api.getHealthData();
      setData(response);
      setIsConnected(true);
      setError(null);
      
      // TODO: Fetch chart data từ API history endpoint
      // const historyResponse = await api.getHealthHistory(7);
      // setChartData(historyResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(message);
      setIsConnected(false);
      console.warn('⚠️ [useHealthData] Không thể lấy dữ liệu:', message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch khi mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Hàm refresh để gọi lại API
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, chartData, loading, error, refresh, isConnected };
}

export default useHealthData;
