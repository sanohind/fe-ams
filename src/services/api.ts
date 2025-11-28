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
    options: RequestInit = {},
    skipAuthRedirect: boolean = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
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
        // Handle 401 Unauthorized (session expired)
        if (response.status === 401 && !skipAuthRedirect) {
          // Only redirect if not on public page
          // Check if we're on a public route
          // Support hash mode: get path from hash if available, otherwise from pathname
          const currentPath = window.location.hash 
            ? window.location.hash.replace('#', '') || '/'
            : window.location.pathname;
          const publicRoutes = ['/driver', '/arrival-dashboard'];
          const isPublicRoute = publicRoutes.some(route => currentPath.startsWith(route));
          
          if (!isPublicRoute) {
            // Clear token and redirect to login
            this.clearToken();
            const appOrigin = window.location.origin;
            // Use hash routing for callback URL
            const callback = `${appOrigin}/#/sso/callback`;
            const sphereSsoBase = import.meta.env.VITE_SPHERE_SSO_URL || 'http://127.0.0.1:8000/sso/login';
            const redirectUrl = `${sphereSsoBase}?redirect=${encodeURIComponent(callback)}`;
            window.location.href = redirectUrl;
          }
        }
        
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

  // Public API methods (no auth redirect)
  private async publicRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, options, true);
  }

  // Dashboard API
  async getMe() {
    return this.request('/user');
  }

  async getDashboardStats(date?: string, isPublic: boolean = false) {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    if (isPublic) {
      return this.publicRequest(`/public/dashboard${qs}`);
    }
    return this.request(`/dashboard${qs}`);
  }

  async getScheduleData(date?: string, isPublic: boolean = false) {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    if (isPublic) {
      return this.publicRequest(`/public/dashboard/schedule${qs}`);
    }
    return this.request(`/dashboard/schedule${qs}`);
  }

  async getDashboardDnDetails(params: { group_key: string; date: string }, isPublic: boolean = false) {
    const query = new URLSearchParams();
    query.append('group_key', params.group_key);
    query.append('date', params.date);
    if (isPublic) {
      return this.publicRequest(`/public/dashboard/dn-details?${query.toString()}`);
    }
    return this.request(`/dashboard/dn-details?${query.toString()}`);
  }

  async getDashboardMetrics() {
    return this.request('/dashboard');
  }

  // Arrival Check API
  async getArrivalCheckList(params?: { date?: string; type?: 'checkin'|'checkout' }, isPublic: boolean = false) {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.type) query.append('type', params.type);
    const qs = query.toString();
    if (isPublic) {
      return this.publicRequest(`/public/arrival-check${qs ? `?${qs}` : ''}`);
    }
    return this.request(`/arrival-check${qs ? `?${qs}` : ''}`);
  }

  async arrivalCheckin(arrival_ids: number[], isPublic: boolean = false) {
    if (isPublic) {
      return this.publicRequest('/public/arrival-check/checkin', {
        method: 'POST',
        body: JSON.stringify({ arrival_ids }),
      });
    }
    return this.request('/arrival-check/checkin', {
      method: 'POST',
      body: JSON.stringify({ arrival_ids }),
    });
  }

  async arrivalCheckout(arrival_ids: number[], isPublic: boolean = false) {
    if (isPublic) {
      return this.publicRequest('/public/arrival-check/checkout', {
        method: 'POST',
        body: JSON.stringify({ arrival_ids }),
      });
    }
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

  async getCheckSheetHistory(date?: string) {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request(`/check-sheet/history${qs}`);
  }

  async downloadCheckSheetPdf(date?: string, options?: { selectedRows?: number[] }) {
    const query = new URLSearchParams();
    if (date) query.append('date', date);
    const selectedRows = options?.selectedRows?.filter((row) => Number.isFinite(row));
    if (selectedRows && selectedRows.length > 0) {
      query.append('selected_rows', selectedRows.join(','));
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    const token = this.token || localStorage.getItem('auth_token');
    
    const url = `${this.baseURL}/check-sheet/download-pdf${qs}`;
    
    // Fetch PDF with authorization
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/pdf',
      },
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to download PDF';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Failed to download PDF: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    // Check if response is actually PDF
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      // Create blob with proper MIME type
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      
      // Open blob URL directly in new window
      // Modern browsers will automatically use PDF viewer for blob URLs with PDF MIME type
      const newWindow = window.open(blobUrl, '_blank');
      
      if (!newWindow) {
        window.URL.revokeObjectURL(blobUrl);
        throw new Error('Please allow popups to view PDF');
      }
      
      // Keep blob URL alive while window is open
      // Check periodically if window is closed
      const checkInterval = setInterval(() => {
        try {
          if (newWindow.closed) {
            window.URL.revokeObjectURL(blobUrl);
            clearInterval(checkInterval);
          }
        } catch (e) {
          // Cross-origin error - window might be closed
          clearInterval(checkInterval);
          // Revoke after a delay to be safe
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
        }
      }, 1000);
      
      // Also revoke after a long timeout as safety measure
      setTimeout(() => {
        try {
          if (newWindow.closed) {
            window.URL.revokeObjectURL(blobUrl);
          }
        } catch (e) {
          // Ignore errors
        }
      }, 300000); // 5 minutes
    } else {
      // If not PDF, might be HTML fallback
      const html = await response.text();
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
        throw new Error('PDF library not installed. Please install dompdf/dompdf package.');
      } else {
        throw new Error('Please allow popups to view PDF');
      }
    }
  }

  // Arrival Management API (backend: /arrival-manage)
  async getArrivalManageList() {
    return this.request('/arrival-manage');
  }

  async getArrivalScheduleForCalendar(params?: {
    start?: string; // YYYY-MM-DD
    end?: string; // YYYY-MM-DD
  }) {
    const queryParams = new URLSearchParams();
    if (params?.start) queryParams.append('start', params.start);
    if (params?.end) queryParams.append('end', params.end);
    const qs = queryParams.toString();
    return this.request(`/arrival-manage${qs ? `?${qs}` : ''}`);
  }

  async getArrivalManageSuppliers() {
    return this.request('/arrival-manage/suppliers');
  }

  async getArrivalManageAvailableArrivals(params: { date?: string; bp_code?: string } = {}) {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.bp_code) query.append('bp_code', params.bp_code);
    const qs = query.toString();
    return this.request(`/arrival-manage/available-arrivals${qs ? `?${qs}` : ''}`);
  }

  async getArrivalManageTransactions(params: { bp_code: string }) {
    const query = new URLSearchParams();
    query.append('bp_code', params.bp_code);
    return this.request(`/arrival-manage/arrival-transactions?${query.toString()}`);
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
    dn_number: string;
  }) {
    return this.request('/item-scan/scan-dn', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDnItemsList(dnNumber: string) {
    return this.request(`/item-scan/dn-items?dn_number=${encodeURIComponent(dnNumber)}`);
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
    completion_dn_number: string;
    label_part_status?: 'OK' | 'NOT_OK';
    coa_msds_status?: 'OK' | 'NOT_OK';
    packing_condition_status?: 'OK' | 'NOT_OK';
  }) {
    return this.request('/item-scan/complete-session', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        ...data
      }),
    });
  }

  async markArrivalIncomplete(arrivalId: number) {
    return this.request('/item-scan/mark-incomplete', {
      method: 'POST',
      body: JSON.stringify({ arrival_id: arrivalId }),
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

  async updateArrivalStatus(id: number, data: {
    actual_arrival_time?: string;
    status?: string;
    notes?: string;
  }) {
    return this.request(`/arrival-schedule/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Check Sheet API (Generic submission)
  async submitCheckSheetGeneric(data: {
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

  // Supplier Contacts
  async getSupplierContacts(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/supplier-contacts${query}`);
  }
}

// Create singleton instance
export const apiService = new ApiService();
export default apiService;
