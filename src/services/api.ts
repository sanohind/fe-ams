// API Service for AMS Frontend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          success: false,
          message: data.message || 'Request failed',
          errors: data.errors,
          status: response.status,
        } as ApiError;
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        // Network error
        throw {
          success: false,
          message: 'Network error. Please check your connection.',
        } as ApiError;
      }
      throw error;
    }
  }

  // Dashboard API
  async getDashboardStats(date?: string) {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request(`/dashboard${qs}`);
  }

  async getScheduleData(date?: string) {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request(`/dashboard/schedule${qs}`);
  }

  async getDashboardDnDetails(params: { group_key: string; date: string }) {
    const query = new URLSearchParams();
    query.append('group_key', params.group_key);
    query.append('date', params.date);
    return this.request(`/dashboard/dn-details?${query.toString()}`);
  }

  async getDashboardMetrics() {
    return this.request('/dashboard');
  }

  // Arrival Check API
  async getArrivalCheckList(params?: { date?: string; type?: 'checkin'|'checkout' }) {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.type) query.append('type', params.type);
    const qs = query.toString();
    return this.request(`/arrival-check${qs ? `?${qs}` : ''}`);
  }

  async arrivalCheckin(arrival_ids: number[]) {
    return this.request('/arrival-check/checkin', {
      method: 'POST',
      body: JSON.stringify({ arrival_ids }),
    });
  }

  async arrivalCheckout(arrival_ids: number[]) {
    return this.request('/arrival-check/checkout', {
      method: 'POST',
      body: JSON.stringify({ arrival_ids }),
    });
  }

  // Check Sheet API
  async getCheckSheetList(date?: string) {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request(`/check-sheet${qs}`);
  }

  async submitCheckSheet(payload: {
    arrival_id: number;
    dn_number: string;
    check_sheet_data: {
      label_part: 'OK'|'NOT_OK';
      coa_msds: 'OK'|'NOT_OK';
      packing_condition: 'OK'|'NOT_OK';
      remarks?: string;
    };
  }) {
    return this.request('/check-sheet/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Arrival Management API (backend: /arrival-manage)
  async getArrivalManageList() {
    return this.request('/arrival-manage');
  }

  async getArrivalManageSuppliers() {
    return this.request('/arrival-manage/suppliers');
  }

  async getArrivalManageAvailableArrivals(params: { date: string; bp_code?: string }) {
    const query = new URLSearchParams();
    query.append('date', params.date);
    if (params.bp_code) query.append('bp_code', params.bp_code);
    return this.request(`/arrival-manage/available-arrivals?${query.toString()}`);
  }

  async createArrivalSchedule(data: {
    bp_code: string;
    day_name: 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday';
    arrival_type: 'regular'|'additional';
    arrival_time: string; // HH:mm
    departure_time?: string; // HH:mm
    dock?: string;
    schedule_date?: string; // YYYY-MM-DD (required for additional)
    arrival_ids?: number[]; // for additional duplication
  }) {
    return this.request('/arrival-manage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateArrivalSchedule(id: number, data: Partial<{
    bp_code: string;
    day_name: 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday';
    arrival_type: 'regular'|'additional';
    arrival_time: string;
    departure_time?: string;
    dock?: string;
    schedule_date?: string;
  }>) {
    return this.request(`/arrival-manage/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteArrivalSchedule(id: number) {
    return this.request(`/arrival-manage/${id}`, {
      method: 'DELETE',
    });
  }

  // Arrival Check API
  async checkInDriver(data: {
    arrival_id: number;
    driver_name: string;
    license_plate: string;
    phone_number?: string;
  }) {
    return this.request('/arrival-check/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkOutDriver(arrivalId: number) {
    return this.request(`/arrival-check/${arrivalId}/check-out`, {
      method: 'POST',
    });
  }

  async getArrivalCheckStatus(arrivalId: number) {
    return this.request(`/arrival-check/${arrivalId}/status`);
  }

  // Item Scan API
  async startScanSession(data: {
    arrival_id: number;
    operator_name: string;
  }) {
    return this.request('/item-scan/start-session', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async scanDn(data: {
    arrival_id: number;
    qr_data: string;
  }) {
    return this.request('/item-scan/scan-dn', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async scanItem(data: {
    session_id: number;
    qr_data: string;
  }) {
    return this.request('/item-scan/scan-item', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeScanSession(sessionId: number, data: {
    quality_checks: {
      label_check: boolean;
      coa_msds_check: boolean;
      packing_check: boolean;
    };
    notes?: string;
  }) {
    return this.request(`/item-scan/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getScanSession(sessionId: number) {
    return this.request(`/item-scan/session/${sessionId}`);
  }

  async getScanStatistics() {
    return this.request('/item-scan/statistics');
  }

  // Level Stock API
  async getStockLevels(params?: {
    warehouse?: string;
    part_no?: string;
    page?: number;
    per_page?: number;
    search?: string;
    status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    return this.request(`/level-stock${queryString ? `?${queryString}` : ''}`);
  }

  async getStockSummary(warehouse?: string) {
    const qs = warehouse ? `?warehouse=${encodeURIComponent(warehouse)}` : '';
    return this.request(`/level-stock/summary${qs}`);
  }

  // Arrival Schedule API (reporting)
  async getArrivalSchedule(params?: {
    date_from?: string;
    date_to?: string;
    status?: string;
    page?: number;
    per_page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    return this.request(`/arrival-schedule${queryString ? `?${queryString}` : ''}`);
  }

  async updateArrivalSchedule(id: number, data: {
    actual_arrival_time?: string;
    status?: string;
    notes?: string;
  }) {
    return this.request(`/arrival-schedule/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Check Sheet API
  async submitCheckSheet(data: {
    arrival_id: number;
    checklist_items: Array<{
      item: string;
      status: 'pass' | 'fail';
      notes?: string;
    }>;
    overall_status: 'pass' | 'fail';
    notes?: string;
  }) {
    return this.request('/check-sheet', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCheckSheet(arrivalId: number) {
    return this.request(`/check-sheet/${arrivalId}`);
  }

  // Sync API
  async manualSync(type: 'arrivals' | 'partners' | 'all' = 'all') {
    return this.request('/sync/manual', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async getSyncLogs(params?: {
    type?: string;
    status?: string;
    page?: number;
    per_page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    return this.request(`/sync/logs${queryString ? `?${queryString}` : ''}`);
  }
}

// Create singleton instance
export const apiService = new ApiService();
export default apiService;
