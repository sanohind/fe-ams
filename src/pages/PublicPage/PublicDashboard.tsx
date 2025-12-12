import { useState, useEffect } from "react";
import { FileText, Clock, Calendar } from "lucide-react";
import DataTableOne, { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import DNListPopup from "../../components/popups/DNListPopup";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import apiService from "../../services/api";

// Interface untuk DN Item
interface DNItem {
  dnNumber: string;
  quantityDN: number;
  quantityActual: number;
  status?: string;
}

// Interface untuk data dashboard dengan multiple DN
interface DashboardDataItem {
  no: number;
  supplier: string;
  schedule: string;
  dock: string;
  platNumber: string;
  securityTimeIn: string;
  securityTimeOut: string;
  securityDuration: string;
  warehouseTimeIn: string;
  warehouseTimeOut: string;
  warehouseDuration: string;
  dnList: DNItem[];
  arrivalStatus: string;
  scanStatus: string;
  dnStatus: string;
  labelPart: string | null;
  coaMsds: string | null;
  packing: string | null;
  pic: string;
  groupKey?: string;
  quantity_dn?: number;
  quantity_actual?: number;
  expectedDnCount?: number;
  deliveredDnCount?: number;
}

const normalizeArrivalStatus = (status?: string) =>
  (status || "").toLowerCase().replace(/[\s-]+/g, "_");

const formatFallbackLabel = (status: string) =>
  status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const parseDurationToMinutes = (value?: string | number | null): number | null => {
  if (value === null || value === undefined) return null;

  const ensureMinutes = (minutes: number) =>
    Number.isNaN(minutes) ? null : Math.max(0, Math.round(minutes));

  if (typeof value === "number") {
    return ensureMinutes(value >= 0 && value < 1 ? value * 60 : value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "-") return null;

    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const numeric = Number(trimmed);
      return ensureMinutes(numeric >= 0 && numeric < 1 ? numeric * 60 : numeric);
    }

    const durationMatch = trimmed.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?$/i);
    if (durationMatch) {
      const hoursNum = Number(durationMatch[1] || 0);
      const minutesNum = Number(durationMatch[2] || 0);
      return ensureMinutes(hoursNum * 60 + minutesNum);
    }

    const colonParts = trimmed.split(":");
    if (colonParts.length >= 2 && colonParts.length <= 3) {
      const [h = "0", m = "0", s = "0"] = colonParts.map((part) =>
        part.trim()
      );
      const hoursNum = Number(h);
      const minutesNum = Number(m);
      const secondsNum = Number(s);
      if (
        [hoursNum, minutesNum, secondsNum].some((num) => Number.isNaN(num))
      ) {
        return null;
      }
      return ensureMinutes(hoursNum * 60 + minutesNum + secondsNum / 60);
    }
  }

  return null;
};

const formatDurationToClock = (value?: string | number | null) => {
  const totalMinutes = parseDurationToMinutes(value);
  if (totalMinutes === null) return "-";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const renderDurationCell = (value?: string | number | null) => (
  <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
    {formatDurationToClock(value)}
  </span>
);

export default function PublicDashboard() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedDNData, setSelectedDNData] = useState<{
    dnList: DNItem[];
    supplier: string;
    platNumber: string;
  } | null>(null);
  const [regularData, setRegularData] = useState<DashboardDataItem[]>([]);
  const [additionalData, setAdditionalData] = useState<DashboardDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [summaryStats, setSummaryStats] = useState<{
    totalSupplier: number;
    totalAdvance: number;
    totalOnTime: number;
    totalDelay: number;
  }>({
    totalSupplier: 0,
    totalAdvance: 0,
    totalOnTime: 0,
    totalDelay: 0,
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data from API
  const fetchDashboardData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const response = await apiService.getDashboardStats(undefined, true);

      if (response.success && response.data) {
        const data = response.data as any;
        const regular = transformApiDataToDashboard(data.regular_arrivals || []);
        const additional = transformApiDataToDashboard(data.additional_arrivals || []);
        setRegularData(regular);
        setAdditionalData(additional);

        const allData = [...regular, ...additional];
        const uniqueSuppliers = new Set(allData.map(item => item.supplier)).size;
        const totalAdvance = allData.filter(item => normalizeArrivalStatus(item.arrivalStatus) === 'advance').length;
        const totalOnTime = allData.filter(item => normalizeArrivalStatus(item.arrivalStatus) === 'on_time').length;
        const totalDelay = allData.filter(item => normalizeArrivalStatus(item.arrivalStatus) === 'delay').length;

        setSummaryStats({
          totalSupplier: uniqueSuppliers,
          totalAdvance,
          totalOnTime,
          totalDelay,
        });
      } else {
        setError(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    // Initial load
    fetchDashboardData(true);

    // Auto-refresh every 5 minutes (silent refresh - no loading screen)
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleViewDNList = async (item: DashboardDataItem) => {
    if (item.groupKey) {
      try {
        const response = await apiService.getDashboardDnDetails({
          group_key: item.groupKey,
          date: new Date().toISOString().split('T')[0]
        }, true);

        if (response.success && response.data) {
          const data = response.data as any;
          const dnList = (data.dn_details || []).map((dn: any) => ({
            dnNumber: dn.dn_number,
            quantityDN: Number(dn.quantity_dn) || 0,
            quantityActual: Number(dn.quantity_actual) || 0,
            status: dn.scan_status || 'Pending',
          }));

          setSelectedDNData({
            dnList: dnList,
            supplier: item.supplier,
            platNumber: item.platNumber
          });
          setIsPopupOpen(true);
        }
      } catch (err) {
        console.error('Error fetching DN details:', err);
        setSelectedDNData({
          dnList: item.dnList,
          supplier: item.supplier,
          platNumber: item.platNumber
        });
        setIsPopupOpen(true);
      }
    } else {
      setSelectedDNData({
        dnList: item.dnList,
        supplier: item.supplier,
        platNumber: item.platNumber
      });
      setIsPopupOpen(true);
    }
  };

  const transformApiDataToDashboard = (apiData: any[]): DashboardDataItem[] => {
    return apiData.map((item, index) => {
      const warehouseTimeIn = item.warehouse_time_in || '-';
      const scheduleTime = item.schedule || '-';
      const arrivalStatus = item.arrival_status || 'pending';

      const dnList = (item.dn_list || []).map((dn: any) => ({
        dnNumber: dn.dn_number || dn.dnNumber || '-',
        quantityDN: Number(dn.quantity_dn || dn.quantityDN || 0),
        quantityActual: Number(dn.quantity_actual || dn.quantityActual || 0),
        status: dn.scan_status || dn.status || 'Pending',
      }));

      const scanStatus = item.scan_status || 'Pending';
      const expectedDnCount = item.dn_count ?? item.expected_dn_count;
      const deliveredDnCount = item.dn_delivered_count ?? dnList.length;
      const dnStatus = item.dn_status || 'Pending';

      return {
        no: index + 1,
        supplier: item.supplier_name || item.bp_code || '-',
        schedule: scheduleTime,
        dock: item.dock || '-',
        platNumber: item.vehicle_plate || '-',
        securityTimeIn: item.security_time_in || '-',
        securityTimeOut: item.security_time_out || '-',
        securityDuration: item.security_duration || '-',
        warehouseTimeIn: warehouseTimeIn,
        warehouseTimeOut: item.warehouse_time_out || '-',
        warehouseDuration: item.warehouse_duration || '-',
        dnList: dnList,
        arrivalStatus: arrivalStatus,
        scanStatus: scanStatus,
        dnStatus: dnStatus,
        labelPart: item.label_part || null,
        coaMsds: item.coa_msds || null,
        packing: item.packing || null,
        pic: item.pic || '-',
        groupKey: item.group_key,
        quantity_dn: Number(item.quantity_dn || 0),
        quantity_actual: Number(item.quantity_actual || 0),
        expectedDnCount: expectedDnCount,
        deliveredDnCount: deliveredDnCount,
      };
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stackedHeaderLabel = (top: string, bottom: string) => (
    <span className="flex flex-col leading-tight text-center">
      <span>{top}</span>
      <span>{bottom}</span>
    </span>
  );

  const getArrivalStatusBadge = (status?: string) => {
    if (!status || status === "-") {
      return null;
    }

    const normalized = normalizeArrivalStatus(status);

    const badgeMap: Record<
      string,
      {
        label: string;
        className: string;
      }
    > = {
      advance: {
        label: "Advance",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      },
      on_time: {
        label: "On time",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      },
      ontime: {
        label: "On time",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      },
      delay: {
        label: "Delay",
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      },
      pending: {
        label: "Pending",
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
    };

    return (
      badgeMap[normalized] || {
        label: formatFallbackLabel(status),
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      }
    );
  };

  const columns: ColumnConfig[] = [
    {
      key: "no",
      label: "No",
      sortable: true,
    },
    {
      key: "supplier",
      label: "Supplier",
      sortable: true,
    },
    {
      key: "schedule",
      label: "Schedule",
      sortable: true,
    },
    {
      key: "dock",
      label: "Dock",
      sortable: true,
    },
    {
      key: "platNumber",
      label: stackedHeaderLabel("Plat", "Number"),
      sortable: true,
    },
    {
      key: "securityTimeIn",
      label: stackedHeaderLabel("SCRT", "In"),
      sortable: false,
    },
    {
      key: "securityTimeOut",
      label: stackedHeaderLabel("SCRT", "Out"),
      sortable: false,
    },
    {
      key: "securityDuration",
      label: "Drtn",
      sortable: false,
      render: (value) => renderDurationCell(value as string | number | null),
    },
    {
      key: "warehouseTimeIn",
      label: stackedHeaderLabel("WH", "In"),
      sortable: false,
    },
    {
      key: "warehouseTimeOut",
      label: stackedHeaderLabel("WH", "Out"),
      sortable: false,
    },
    {
      key: "warehouseDuration",
      label: "Drtn",
      sortable: false,
      render: (value) => renderDurationCell(value as string | number | null),
    },
    {
      key: "arrivalStatus",
      label: stackedHeaderLabel("Arrival", "Status"),
      sortable: true,
      render: (value) => {
        const badge = getArrivalStatusBadge(value as string);
        if (!badge) {
          return <span className="text-gray-500">-</span>;
        }

        return (
          <span
            className={`px-2.5 py-1 text-xs font-medium rounded-full ${badge.className}`}
          >
            {badge.label}
          </span>
        );
      }
    },
    {
      key: "dnList",
      label: "DN Number",
      sortable: false,
      render: (value, row) => {
        const dnList = value as DNItem[];
        const totalDN = dnList.length;

        return (
          <button
            onClick={() => handleViewDNList(row as DashboardDataItem)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>{totalDN} DN(s)</span>
          </button>
        );
      }
    },
    {
      key: "quantity_dn",
      label: "Qty (DN)",
      sortable: true,
      render: (_value, row: any) => {
        const qty = row.quantity_dn || (row.dnList as DNItem[])?.reduce((sum, dn) => sum + dn.quantityDN, 0) || 0;
        return <span className=" dark:text-white">{qty.toLocaleString()}</span>;
      }
    },
    {
      key: "quantity_actual",
      label: "Qty (Actual)",
      sortable: true,
      render: (_value, row: any) => {
        const qtyDN = row.quantity_dn || (row.dnList as DNItem[])?.reduce((sum, dn) => sum + dn.quantityDN, 0) || 0;
        const qtyActual = row.quantity_actual || (row.dnList as DNItem[])?.reduce((sum, dn) => sum + dn.quantityActual, 0) || 0;
        const isMatch = qtyDN === qtyActual;

        return (
          <span className={`font-medium ${isMatch
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
            }`}>
            {qtyActual.toLocaleString()}
          </span>
        );
      }
    },
    {
      key: "scanStatus",
      label: "Scan Status",
      sortable: true,
      render: (value) => {
        const statusColors: Record<string, string> = {
          "Completed": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
          "Pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        };

        return (
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[value] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: "dnStatus",
      label: "DN Status",
      sortable: true,
      render: (value) => {
        const statusColors: Record<string, string> = {
          "Pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
          "On Commitment": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          "Incomplete Qty": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
          "Outstanding DN": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
          "Delay": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          "No Show": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
        };

        return (
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[value] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"}`}>
            {value}
          </span>
        );
      }
    },
    {
      key: "pic",
      label: "PIC",
      sortable: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Floating Theme Toggle Button */}
      <div className="fixed z-50 bottom-6 right-6">
        <ThemeTogglerTwo />
      </div>

      {/* Subtle refresh indicator */}
      {isRefreshing && (
        <div className="fixed top-4 right-4 z-40 bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Refreshing...
        </div>
      )}

      {/* Header with Date and Time */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Arrival Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time arrival tracking and monitoring
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Calendar className="w-5 h-5" />
                <span className="text-lg font-semibold">{formatDate(currentTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Clock className="w-5 h-5" />
                <span className="text-2xl font-bold">{formatTime(currentTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-5 sm:space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error loading dashboard
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Statistics Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Supplier Card */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Supplier
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {summaryStats.totalSupplier}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                  <svg
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Advance Card */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Advance
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {summaryStats.totalAdvance}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                  <svg
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total On Time Card */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total On Time
                  </p>
                  <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                    {summaryStats.totalOnTime}
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
                  <svg
                    className="h-5 w-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Delay Card */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Delay
                  </p>
                  <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                    {summaryStats.totalDelay}
                  </p>
                </div>
                <div className="rounded-lg bg-red-50 p-2 dark:bg-red-900/20">
                  <svg
                    className="h-5 w-5 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 sm:space-y-6">
            <DataTableOne
              title="Regular Arrival"
              data={regularData}
              columns={columns}
              defaultItemsPerPage={10}
              itemsPerPageOptions={[5, 10, 15, 20]}
              defaultSortKey="no"
              defaultSortOrder="asc"
              searchable={true}
              searchPlaceholder="Search suppliers, DN numbers..."
            />
          </div>

          <div className="space-y-5 sm:space-y-6">
            <DataTableOne
              title="Additional Arrival"
              data={additionalData}
              columns={columns}
              defaultItemsPerPage={10}
              itemsPerPageOptions={[5, 10, 15, 20]}
              defaultSortKey="no"
              defaultSortOrder="asc"
              searchable={true}
              searchPlaceholder="Search suppliers, DN numbers..."
            />
          </div>

          {/* DN List Popup */}
          {selectedDNData && (
            <DNListPopup
              isOpen={isPopupOpen}
              onClose={() => setIsPopupOpen(false)}
              dnList={selectedDNData.dnList}
              supplier={selectedDNData.supplier}
              platNumber={selectedDNData.platNumber}
            />
          )}
        </div>
      </div>
    </div>
  );
}

