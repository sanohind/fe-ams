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
  async getDashboardStats() {
    return this.request('/dashboard');
  }

  async getDashboardMetrics() {
    return this.request('/dashboard');
  }

  // Arrival Management API
  async getArrivals(params?: {
    status?: string;
    date_from?: string;
    date_to?: string;
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
    return this.request(`/arrivals${queryString ? `?${queryString}` : ''}`);
  }

  async getArrival(id: number) {
    return this.request(`/arrivals/${id}`);
  }

  async createArrival(data: {
    dn_number: string;
    supplier_name: string;
    planned_delivery_time: string;
    expected_items_count: number;
    notes?: string;
  }) {
    return this.request('/arrivals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateArrival(id: number, data: Partial<{
    dn_number: string;
    supplier_name: string;
    planned_delivery_time: string;
    expected_items_count: number;
    notes: string;
  }>) {
    return this.request(`/arrivals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteArrival(id: number) {
    return this.request(`/arrivals/${id}`, {
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

  // Arrival Schedule API
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
  async triggerSync(type: 'all' | 'dn_header' | 'dn_detail' | 'business_partner' = 'all') {
    return this.request('/sync/trigger', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async getSyncStatus() {
    return this.request('/sync/status');
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
