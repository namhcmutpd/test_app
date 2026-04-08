// ===========================================
// HOOK: useHealthConnect - Quản lý kết nối Health Connect
// ===========================================

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  initHealthConnect,
  requestHealthPermissions,
  readAllHealthData,
  HealthConnectData,
  HealthConnectStatus,
} from '../services/healthConnect';
import { api } from '../services/api';

interface UseHealthConnectReturn {
  // Status
  status: HealthConnectStatus;
  isAvailable: boolean;
  hasPermission: boolean;
  
  // Data
  data: HealthConnectData | null;
  loading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
  
  // Actions
  requestPermissions: () => Promise<boolean>;
  refreshData: () => Promise<void>;
  syncToServer: () => Promise<boolean>;
}

export function useHealthConnect(): UseHealthConnectReturn {
  const [status, setStatus] = useState<HealthConnectStatus>('NOT_SUPPORTED');
  const [hasPermission, setHasPermission] = useState(false);
  const [data, setData] = useState<HealthConnectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Khởi tạo khi mount
  useEffect(() => {
    const init = async () => {
      if (Platform.OS !== 'android') {
        setStatus('NOT_SUPPORTED');
        return;
      }

      const initStatus = await initHealthConnect();
      setStatus(initStatus);
    };

    init();
  }, []);

  // Yêu cầu quyền
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (status !== 'AVAILABLE') {
      setError('Health Connect không khả dụng');
      return false;
    }

    try {
      const granted = await requestHealthPermissions();
      setHasPermission(granted);
      
      if (!granted) {
        setError('Quyền truy cập bị từ chối');
      }
      
      return granted;
    } catch (err) {
      setError('Lỗi yêu cầu quyền');
      return false;
    }
  }, [status]);

  // Đọc dữ liệu
  const refreshData = useCallback(async (): Promise<void> => {
    if (status !== 'AVAILABLE') {
      setError('Health Connect không khả dụng');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Yêu cầu quyền nếu chưa có
      if (!hasPermission) {
        const granted = await requestHealthPermissions();
        if (!granted) {
          setError('Cần cấp quyền truy cập Health Connect');
          setLoading(false);
          return;
        }
        setHasPermission(true);
      }

      // Đọc dữ liệu
      const healthData = await readAllHealthData();
      
      if (healthData) {
        setData(healthData);
        setLastSyncTime(new Date());
        console.log('✅ [useHealthConnect] Đã đọc dữ liệu từ Health Connect');
      } else {
        setError('Không có dữ liệu từ Health Connect');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(message);
      console.error('❌ [useHealthConnect] Lỗi:', message);
    } finally {
      setLoading(false);
    }
  }, [status, hasPermission]);

  // Đồng bộ lên server
  const syncToServer = useCallback(async (): Promise<boolean> => {
    if (!data) {
      setError('Không có dữ liệu để đồng bộ');
      return false;
    }

    try {
      setLoading(true);
      
      // Chuyển đổi dữ liệu Health Connect sang format API
      const now = new Date().toISOString();
      const metrics = [
        {
          metric_id: `hc_${Date.now()}`,
          record_time: now,
          heart_rate: data.heartRate.current || undefined,
          steps: data.steps.today || undefined,
          sleep_duration: data.sleep.duration ? Math.round(data.sleep.duration) : undefined,
          calories: data.steps.calories || undefined,
          distance: data.steps.distance || undefined,
          oxygen_saturation: data.oxygen.current || undefined,
        },
      ];

      // Gọi API sync metrics (không gửi device_id - backend cho phép sync từ Health Connect)
      await api.syncMetrics({
        metrics,
      });
      
      console.log('✅ [useHealthConnect] Đã sync dữ liệu lên server');
      setLastSyncTime(new Date());
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi đồng bộ';
      setError(message);
      console.error('❌ [useHealthConnect] Lỗi sync:', message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [data]);

  return {
    status,
    isAvailable: status === 'AVAILABLE',
    hasPermission,
    data,
    loading,
    error,
    lastSyncTime,
    requestPermissions,
    refreshData,
    syncToServer,
  };
}

export default useHealthConnect;
