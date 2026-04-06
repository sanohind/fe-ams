import { useState, useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput } from "@fullcalendar/core";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne, { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import DNListPopup from "../../components/popups/DNListPopup";
import DatePicker from "../../components/form/date-picker";
import { SkeletonArrivalSchedule } from "../../components/ui/skeleton/Skeleton";
import apiService from "../../services/api";
import Button from "../../components/ui/button/Button";
import { useToast } from "../../hooks/useToast";

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
  scheduleDate?: string;  // Only populated in date range mode
  schedule: string; // Kept for backwards compatibility
  arrivalPlan: string;
  departurePlan: string;
  dock: string;
  platNumber: string;
  securityTimeIn: string;
  securityTimeOut: string;
  securityDuration: string;
  warehouseTimeIn: string;
  warehouseTimeOut: string;
  warehouseDuration: string;
  dnList: DNItem[]; // Array of DN items
  arrivalStatus: string;
  scanStatus: string;
  dnStatus: string; // New field for DN completeness status
  labelPart: string | null;
  coaMsds: string | null;
  packing: string | null;
  pic: string;
  groupKey?: string;
  quantity_dn?: number;
  quantity_actual?: number;
  expectedDnCount?: number; // Total DN expected for this schedule
  deliveredDnCount?: number; // DN count that has been delivered
}

// Interface untuk Arrival Schedule dari API
interface ArrivalScheduleData {
  id: number;
  bp_code: string;
  day_name: string;
  arrival_type: 'regular' | 'additional';
  schedule_date: string | null;
  arrival_time: string;
  departure_time: string | null;
  dock: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

// Interface untuk Calendar Event
interface CalendarEvent extends EventInput {
  extendedProps: {
    arrivalType: 'regular' | 'additional';
    bpCode: string;
    dock: string | null;
  };
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

export default function ArrivalSchedule() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedDNData, setSelectedDNData] = useState<{
    dnList: DNItem[];
    supplier: string;
    platNumber: string;
  } | null>(null);
  const [regularData, setRegularData] = useState<DashboardDataItem[]>([]);
  const [additionalData, setAdditionalData] = useState<DashboardDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<CalendarEvent | null>(null);
  const [eventPopoverPosition, setEventPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const toast = useToast();

  // ── Filter state ──────────────────────────────────────────────────────────
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [filterMode, setFilterMode] = useState<'single' | 'range'>('single');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);   // single date OR date_from
  const [dateTo, setDateTo] = useState<string>(todayStr);               // only used in range mode
  const [filterApplied, setFilterApplied] = useState(false);            // whether Apply has been clicked

  // Supplier dropdown
  interface Supplier { bp_code: string; bp_name: string; }
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const filteredSuppliers = suppliers.filter(s =>
    s.bp_name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.bp_code.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  // ── Computed download eligibility ────────────────────────────────────────
  /**
   * Returns:
   *  'ok'      → can download
   *  'today'   → range includes today (or is today in single mode with custom — existing file check is server-side)
   *  'future'  → range is in the future
   */
  const downloadStatus = (): 'ok' | 'today_range' | 'not_applied' => {
    if (!filterApplied) return 'not_applied';
    if (filterMode === 'range') {
      // Range: hide if range includes today or future
      if (dateTo >= todayStr) return 'today_range';
    } else {
      // Single date: hide if date is today or future
      if (selectedDate >= todayStr) return 'today_range';
    }
    return 'ok';
  };

  // ── Load supplier list once ──────────────────────────────────────────────
  useEffect(() => {
    apiService.getDailyReportSuppliers().then((res: any) => {
      if (res?.success && Array.isArray(res.data)) setSuppliers(res.data);
    }).catch(() => {/* silently ignore */ });
  }, []);

  // ── Apply Filter → fetch schedule data ───────────────────────────────────
  const applyFilter = async () => {
    try {
      setLoading(true);
      setFilterApplied(true);

      const bpCode = selectedSupplier?.bp_code;

      if (filterMode === 'single') {
        // Use /arrival-schedule endpoint (same format as dashboard, supports bp_code)
        const response: any = await apiService.getArrivalScheduleByDate({ date: selectedDate, bp_code: bpCode });
        if (response?.success && response.data) {
          const data = response.data as any;
          setRegularData(transformApiDataToDashboard(data.regular_arrivals || []));
          setAdditionalData(transformApiDataToDashboard(data.additional_arrivals || []));
        } else {
          const detail = response?.errors ? Object.values(response.errors).flat().join(' ') : null;
          toast.error(detail || response?.message || 'Gagal memuat data jadwal', { title: 'Error loading schedule data' });
        }

      } else {
        // Use new range API
        const response: any = await apiService.getArrivalScheduleRange({
          date_from: selectedDate,
          date_to: dateTo,
          bp_code: bpCode,
        });
        if (response?.success && response.data) {
          const data = response.data as any;
          const regular = transformApiDataToDashboard(data.regular_arrivals || []);
          const additional = transformApiDataToDashboard(data.additional_arrivals || []);
          setRegularData(regular);
          setAdditionalData(additional);
        } else {
          const detail = response?.errors ? Object.values(response.errors).flat().join(' ') : null;
          toast.error(detail || response?.message || 'Gagal memuat data jadwal', { title: 'Error loading schedule data' });
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch schedule data', { title: 'Error loading schedule data' });
    } finally {
      setLoading(false);
    }
  };

  // Initial load: fetch data for today but do NOT set filterApplied
  // so that action buttons (Download/Recalculate) don't appear until the user explicitly applies a filter
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoading(true);
        const response: any = await apiService.getArrivalScheduleByDate({ date: todayStr });
        if (response?.success && response.data) {
          const data = response.data as any;
          setRegularData(transformApiDataToDashboard(data.regular_arrivals || []));
          setAdditionalData(transformApiDataToDashboard(data.additional_arrivals || []));
        } else {
          const detail = response?.errors ? Object.values(response.errors).flat().join(' ') : null;
          toast.error(detail || response?.message || 'Gagal memuat data jadwal hari ini', { title: 'Error loading schedule data' });
        }
      } catch (err: any) {
        toast.error(err.message || 'Gagal memuat data jadwal hari ini', { title: 'Error loading schedule data' });
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecalculateStatus = async () => {
    try {
      setRecalculating(true);
      const response = await apiService.recalculateArrivalStatus(selectedDate);
      if (response.success) {
        toast.success('Arrival status recalculated successfully', { title: 'Recalculation Complete' });
        await applyFilter();
      } else {
        throw new Error(response.message || 'Failed to re-calculate status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to re-calculate arrival status.', { title: 'Recalculation Failed' });
    } finally {
      setRecalculating(false);
    }
  };

  // Download handler — decides single daily report vs. custom PDF
  const handleDownloadReport = async () => {
    const ds = downloadStatus();
    if (ds === 'today_range') {
      toast.warning('Tidak dapat mengunduh laporan yang mencakup hari ini karena data belum lengkap. Pilih rentang tanggal sebelum hari ini.', { title: 'Data Belum Lengkap' });
      return;
    }
    if (ds === 'not_applied') {
      toast.warning('Tekan Apply Filter terlebih dahulu.', { title: 'Filter Belum Diterapkan' });
      return;
    }

    try {
      setDownloadingReport(true);

      const isSimpleSingleDate = filterMode === 'single' && !selectedSupplier;

      if (isSimpleSingleDate) {
        // Download pre-generated daily report
        const response = await apiService.downloadDailyReport(selectedDate);
        if (!response.ok) throw new Error('Failed to download report');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `daily-report-${selectedDate}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Generate custom PDF
        await apiService.downloadCustomDailyReport({
          date_from: selectedDate,
          date_to: filterMode === 'range' ? dateTo : selectedDate,
          bp_code: selectedSupplier?.bp_code,
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunduh laporan.', { title: 'Download Gagal' });
    } finally {
      setDownloadingReport(false);
    }
  };


  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setCalendarLoading(true);
        const response = await apiService.getArrivalScheduleForCalendar();

        if (response.success && response.data) {
          const schedules = response.data as ArrivalScheduleData[];
          const events = transformSchedulesToCalendarEvents(schedules);
          setCalendarEvents(events);
        }
      } catch (err: any) {
        console.error('Error fetching calendar schedule data:', err);
      } finally {
        setCalendarLoading(false);
      }
    };

    fetchCalendarData();
  }, []);

  // Transform arrival schedules to calendar events
  const transformSchedulesToCalendarEvents = (schedules: ArrivalScheduleData[]): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 3, 0); // Show 3 months ahead

    schedules.forEach((schedule) => {
      if (schedule.arrival_type === 'regular') {
        // Regular schedule - recurring events based on day_name
        const dayNameToDayOfWeek: Record<string, number> = {
          'monday': 1,
          'tuesday': 2,
          'wednesday': 3,
          'thursday': 4,
          'friday': 5,
          'saturday': 6,
          'sunday': 0,
        };

        const dayOfWeek = dayNameToDayOfWeek[schedule.day_name.toLowerCase()];
        if (dayOfWeek !== undefined) {
          // Generate recurring events for the next 3 months
          let currentDate = new Date(startOfMonth);

          // Find first occurrence of the day
          while (currentDate.getDay() !== dayOfWeek && currentDate <= endOfMonth) {
            currentDate.setDate(currentDate.getDate() + 1);
          }

          while (currentDate <= endOfMonth) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const timeParts = schedule.arrival_time.split(':');
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1] || '0', 10);
            const eventDate = new Date(currentDate);
            eventDate.setHours(hours, minutes, 0, 0);

            let endDate: Date | undefined;
            if (schedule.departure_time) {
              const depTimeParts = schedule.departure_time.split(':');
              const depHours = parseInt(depTimeParts[0], 10);
              const depMinutes = parseInt(depTimeParts[1] || '0', 10);
              endDate = new Date(eventDate);
              endDate.setHours(depHours, depMinutes, 0, 0);
            }

            events.push({
              id: `regular-${schedule.id}-${dateStr}`,
              title: schedule.bp_code,
              start: eventDate.toISOString(),
              end: endDate ? endDate.toISOString() : undefined,
              allDay: false,
              backgroundColor: '#3b82f6', // Blue for regular
              borderColor: '#2563eb',
              textColor: '#ffffff',
              extendedProps: {
                arrivalType: 'regular',
                bpCode: schedule.bp_code,
                dock: schedule.dock,
              },
            });

            // Move to next week
            currentDate.setDate(currentDate.getDate() + 7);
          }
        }
      } else if (schedule.arrival_type === 'additional' && schedule.schedule_date) {
        // Additional schedule - one-time event on specific date
        const timeParts = schedule.arrival_time.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1] || '0', 10);
        const eventDate = new Date(schedule.schedule_date);
        eventDate.setHours(hours, minutes, 0, 0);

        let endDate: Date | undefined;
        if (schedule.departure_time) {
          const depTimeParts = schedule.departure_time.split(':');
          const depHours = parseInt(depTimeParts[0], 10);
          const depMinutes = parseInt(depTimeParts[1] || '0', 10);
          endDate = new Date(eventDate);
          endDate.setHours(depHours, depMinutes, 0, 0);
        }

        events.push({
          id: `additional-${schedule.id}`,
          title: schedule.bp_code,
          start: eventDate.toISOString(),
          end: endDate ? endDate.toISOString() : undefined,
          allDay: false,
          backgroundColor: '#10b981', // Green for additional
          borderColor: '#059669',
          textColor: '#ffffff',
          extendedProps: {
            arrivalType: 'additional',
            bpCode: schedule.bp_code,
            dock: schedule.dock,
          },
        });
      }
    });

    return events;
  };

  const handleViewDNList = async (item: DashboardDataItem) => {
    // Fetch DN details from API if group_key is available
    if (item.groupKey) {
      try {
        const response = await apiService.getDashboardDnDetails({
          group_key: item.groupKey,
          date: selectedDate
        });

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
        // Fallback to local data
        setSelectedDNData({
          dnList: item.dnList,
          supplier: item.supplier,
          platNumber: item.platNumber
        });
        setIsPopupOpen(true);
      }
    } else {
      // Use local data
      setSelectedDNData({
        dnList: item.dnList,
        supplier: item.supplier,
        platNumber: item.platNumber
      });
      setIsPopupOpen(true);
    }
  };

  // Transform API data to dashboard format
  const transformApiDataToDashboard = (apiData: any[]): DashboardDataItem[] => {
    return apiData.map((item, index) => {
      const warehouseTimeIn = item.warehouse_time_in || '-';
      const scheduleTime = item.schedule || '-';

      // Use arrival_status directly from backend (from arrival_transactions.status column)
      // Frontend should not calculate status - it's determined by backend logic
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

      // DN Status comes from backend's delivery_compliance (worst status from group)
      const dnStatus = item.dn_status || 'Pending';

      return {
        no: index + 1,
        supplier: item.supplier_name || item.bp_code || '-',
        scheduleDate: item.schedule_date || undefined,
        schedule: item.arrival_plan || scheduleTime, // Use arrival_plan, fallback to schedule for backwards compatibility
        arrivalPlan: item.arrival_plan || scheduleTime,
        departurePlan: item.departure_plan || '-',
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

  // Konfigurasi kolom — kolom Date hanya muncul saat mode Date Range
  const dateColumn: ColumnConfig = {
    key: "scheduleDate",
    label: "Date",
    sortable: true,
    rowSpan: 2,
    render: (value) => (
      <span className="font-mono text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
        {value ? String(value) : '-'}
      </span>
    ),
  };

  const columns: ColumnConfig[] = [
    {
      key: "no",
      label: "No",
      sortable: true,
      rowSpan: 2,
    },
    ...(filterMode === 'range' ? [dateColumn] : []),
    {
      key: "supplier",
      label: "Supplier",
      sortable: true,
      rowSpan: 2,
    },
    {
      key: "schedule",
      label: "Arrival",
      sortable: true,
      group: "Plan",
    },
    {
      key: "departurePlan",
      label: "Departure",
      sortable: true,
      group: "Plan",
    },
    {
      key: "dock",
      label: "Dock",
      sortable: true,
      rowSpan: 2,
    },
    {
      key: "platNumber",
      label: "Plat Number",
      sortable: true,
      rowSpan: 2,
    },
    {
      key: "securityTimeIn",
      label: "Arrival",
      sortable: false,
      group: "Security",
    },
    {
      key: "securityTimeOut",
      label: "Departure",
      sortable: false,
      group: "Security",
    },
    {
      key: "securityDuration",
      label: "Duration",
      sortable: false,
      group: "Security",
      render: (value) => renderDurationCell(value as string | number | null),
    },
    {
      key: "warehouseTimeIn",
      label: "Arrival",
      sortable: false,
      group: "Warehouse",
    },
    {
      key: "warehouseTimeOut",
      label: "Departure",
      sortable: false,
      group: "Warehouse",
    },
    {
      key: "warehouseDuration",
      label: "Duration",
      sortable: false,
      group: "Warehouse",
      render: (value) => renderDurationCell(value as string | number | null),
    },
    {
      key: "arrivalStatus",
      label: "Arrival Status",
      sortable: true,
      rowSpan: 2,
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
      rowSpan: 2,
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
      label: "DN",
      sortable: true,
      group: "Quantity",
      render: (_value, row: any) => {
        const qty = row.quantity_dn || (row.dnList as DNItem[])?.reduce((sum, dn) => sum + dn.quantityDN, 0) || 0;
        return <span className=" dark:text-white">{qty.toLocaleString()}</span>;
      }
    },
    {
      key: "quantity_actual",
      label: "Actual",
      sortable: true,
      group: "Quantity",
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
      key: "labelPart",
      label: "Label Part",
      sortable: false,
      group: "Item Check",
      render: (value) => {
        if (!value || value === 'PENDING') return <span className="text-gray-400">-</span>;
        return (
          <input
            type="checkbox"
            checked={value === 'OK'}
            disabled
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        );
      }
    },
    {
      key: "coaMsds",
      label: "COA/MSDS",
      sortable: false,
      group: "Item Check",
      render: (value) => {
        if (!value || value === 'PENDING') return <span className="text-gray-400">-</span>;
        return (
          <input
            type="checkbox"
            checked={value === 'OK'}
            disabled
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        );
      }
    },
    {
      key: "packing",
      label: "Packing",
      sortable: false,
      group: "Item Check",
      render: (value) => {
        if (!value || value === 'PENDING') return <span className="text-gray-400">-</span>;
        return (
          <input
            type="checkbox"
            checked={value === 'OK'}
            disabled
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        );
      }
    },
    {
      key: "scanStatus",
      label: "Scan",
      sortable: true,
      group: "Status",
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
      label: "DN",
      sortable: true,
      group: "Status",
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
      rowSpan: 2,
    },
  ];

  if (loading) {
    return (
      <div className="overflow-x-hidden space-y-5 sm:space-y-6">
        <PageMeta
          title="Arrival Schedule | SPHERE by SANOH Indonesia"
          description="This is React.js Arrival Schedule page for SPHERE by SANOH Indonesia"
        />
        <PageBreadcrumb pageTitle="Arrival Schedule" />
        <SkeletonArrivalSchedule />
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden space-y-5 sm:space-y-6">
      <PageMeta
        title="Arrival Schedule | SPHERE by SANOH Indonesia"
        description="This is React.js Arrival Schedule page for SPHERE by SANOH Indonesia"
      />
      <PageBreadcrumb pageTitle="Arrival Schedule" />

      {/* ── Filter Card ── */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4 mb-3">

        {/* Row 1: Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
            <button
              className={`px-5 py-2 font-medium transition-colors ${filterMode === 'single' ? 'bg-brand-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              onClick={() => { setFilterMode('single'); setFilterApplied(false); }}
            >
              Single Date
            </button>
            <button
              className={`px-5 py-2 font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${filterMode === 'range' ? 'bg-brand-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              onClick={() => { setFilterMode('range'); setFilterApplied(false); }}
            >
              Date Range
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-gray-800" />

        {/* Row 2: Filter Inputs + Apply */}
        <div className="flex flex-wrap items-end gap-4">

          {/* Date From / Single Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {filterMode === 'single' ? 'Date' : 'Date From'}
            </label>
            <div className="w-[220px]">
              <DatePicker
                id="arrival-schedule-date-from"
                mode="single"
                placeholder="Select date"
                defaultDate={selectedDate}
                isStatic={false}
                position="auto left"
                onChange={(selectedDates, dateStr) => {
                  if (selectedDates && selectedDates.length > 0) {
                    const d = selectedDates[0];
                    const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    setSelectedDate(formatted);
                  } else if (dateStr) {
                    setSelectedDate(dateStr);
                  }
                  setFilterApplied(false);
                }}
              />
            </div>
          </div>

          {/* Date To (range mode only) */}
          {filterMode === 'range' && (
            <>
              <div className="flex items-center pb-[10px]">
                <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">—</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date To</label>
                <div className="w-[220px]">
                  <DatePicker
                    id="arrival-schedule-date-to"
                    mode="single"
                    placeholder="Select end date"
                    defaultDate={dateTo}
                    isStatic={false}
                    position="auto left"
                    onChange={(selectedDates, dateStr) => {
                      if (selectedDates && selectedDates.length > 0) {
                        const d = selectedDates[0];
                        const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        setDateTo(formatted);
                      } else if (dateStr) {
                        setDateTo(dateStr);
                      }
                      setFilterApplied(false);
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Separator */}
          <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 self-end mb-0.5 hidden sm:block" />

          {/* Supplier Combobox */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Supplier (optional)</label>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search supplier..."
                className="w-full h-[42px] pl-3.5 pr-9 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-colors"
                value={selectedSupplier ? `${selectedSupplier.bp_code} - ${selectedSupplier.bp_name}` : supplierSearch}
                onChange={e => {
                  setSelectedSupplier(null);
                  setSupplierSearch(e.target.value);
                  setShowSupplierDropdown(true);
                  setFilterApplied(false);
                }}
                onFocus={() => setShowSupplierDropdown(true)}
                onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 150)}
              />
              {selectedSupplier ? (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-base leading-none"
                  onMouseDown={e => { e.preventDefault(); setSelectedSupplier(null); setSupplierSearch(''); setFilterApplied(false); }}
                >
                  <svg className="w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <span className="absolute text-gray-400 pointer-events-none right-3.5 top-1/2 -translate-y-1/2">
                  <svg
                    className="fill-current"
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                      fill=""
                    />
                  </svg>
                </span>
              )}
              {showSupplierDropdown && !selectedSupplier && filteredSuppliers.length > 0 && (
                <div className="absolute z-50 top-full mt-1 left-0 w-full max-h-52 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
                  {filteredSuppliers.slice(0, 50).map(s => (
                    <button
                      key={s.bp_code}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 text-gray-700 dark:text-gray-200 border-b border-gray-50 dark:border-gray-800 last:border-0"
                      onMouseDown={e => { e.preventDefault(); setSelectedSupplier(s); setSupplierSearch(''); setShowSupplierDropdown(false); setFilterApplied(false); }}
                    >
                      <span className="font-semibold text-brand-600 dark:text-brand-400">{s.bp_code}</span>
                      <span className="ml-2 text-gray-500 dark:text-gray-400 truncate">{s.bp_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-xs opacity-0 select-none">apply</label>
            <Button variant="primary" size="sm" onClick={applyFilter} disabled={loading} className="h-[42px] px-6">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading...
                </span>
              ) : 'Apply Filter'}
            </Button>
          </div>

        </div>
      </div>

      {/* ── Action Bar (below filter card) ── */}
      {filterApplied && (
        <div className="flex items-center justify-between gap-3 mb-4 px-1">
          {/* Download status / warning */}
          <div className="flex items-center gap-3">
            {filterMode === 'single' && selectedDate < todayStr && (
              <Button variant="primary" size="sm" onClick={handleRecalculateStatus} disabled={recalculating}>
                {recalculating ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Re-calculating...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 12C4 7.58172 7.58172 4 12 4C14.5264 4 16.7792 5.17108 18.2454 7H16C15.4477 7 15 7.44772 15 8C15 8.55228 15.4477 9 16 9H20.5C21.0523 9 21.5 8.55228 21.5 8V3.5C21.5 2.94772 21.0523 2.5 20.5 2.5C19.9477 2.5 19.5 2.94772 19.5 3.5V5.26756C17.6318 3.25107 14.9602 2 12 2C6.47715 2 2 6.47715 2 12C2 12.5523 2.44772 13 3 13C3.55228 13 4 12.5523 4 12Z" />
                      <path d="M20 12C20 16.4183 16.4183 20 12 20C9.47362 20 7.22075 18.8289 5.75463 17H8C8.55228 17 9 16.5523 9 16C9 15.4477 8.55228 15 8 15H3.5C2.94772 15 2.5 15.4477 2.5 16V20.5C2.5 21.0523 2.94772 21.5 3.5 21.5C4.05228 21.5 4.5 21.0523 4.5 20.5V18.7324C6.36824 20.7489 9.03976 22 12 22C17.5228 22 22 17.5228 22 12C22 11.4477 21.5523 11 21 11C20.4477 11 20 11.4477 20 12Z" />
                    </svg>
                    Re-calculate Status
                  </span>
                )}
              </Button>
            )}

            {downloadStatus() === 'today_range' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-800 dark:text-amber-300">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Download tidak tersedia — rentang mencakup hari ini, data belum lengkap</span>
              </div>
            )}
          </div>

          {/* Action buttons — right side */}
          <div className="flex items-center gap-2 ml-auto">
            {downloadStatus() === 'ok' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadReport}
                disabled={downloadingReport}
              >
                {downloadingReport ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Downloading...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10.0018 14.083C9.7866 14.083 9.59255 13.9924 9.45578 13.8472L5.61586 10.0097C5.32288 9.71688 5.32272 9.242 5.61552 8.94902C5.90832 8.65603 6.3832 8.65588 6.67618 8.94868L9.25182 11.5227L9.25182 3.33301C9.25182 2.91879 9.5876 2.58301 10.0018 2.58301C10.416 2.58301 10.7518 2.91879 10.7518 3.33301L10.7518 11.5193L13.3242 8.94866C13.6172 8.65587 14.0921 8.65604 14.3849 8.94903C14.6777 9.24203 14.6775 9.7169 14.3845 10.0097L10.5761 13.8154C10.4385 13.979 10.2323 14.083 10.0018 14.083ZM4.0835 13.333C4.0835 12.9188 3.74771 12.583 3.3335 12.583C2.91928 12.583 2.5835 12.9188 2.5835 13.333V15.1663C2.5835 16.409 3.59086 17.4163 4.8335 17.4163H15.1676C16.4102 17.4163 17.4176 16.409 17.4176 15.1663V13.333C17.4176 12.9188 17.0818 12.583 16.6676 12.583C16.2533 12.583 15.9176 12.9188 15.9176 13.333V15.1663C15.9176 15.5806 15.5818 15.9163 15.1676 15.9163H4.0835C4.41928 15.9163 4.0835 15.5806 4.0835 15.1663V13.333Z" />
                    </svg>
                    Download Report
                  </span>
                )}
              </Button>
            )}

          </div>
        </div>
      )}


      <div className="space-y-5 sm:space-y-6">
        <DataTableOne
          title="Regular Arrival"
          data={regularData}
          columns={columns}
          defaultItemsPerPage={10}
          itemsPerPageOptions={[5, 10, 15, 20]}
          defaultSortKey="schedule"
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
          defaultSortKey="schedule"
          defaultSortOrder="asc"
          searchable={true}
          searchPlaceholder="Search suppliers, DN numbers..."
        />
      </div>

      {/* Calendar Section */}
      <div className="space-y-5 sm:space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Arrival Schedule Calendar
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View all supplier arrival schedules. Regular schedules are shown in blue, additional schedules are shown in green.
            </p>
          </div>

          {calendarLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading calendar...</p>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="custom-calendar">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "dayGridMonth,timeGridWeek,timeGridDay",
                  }}
                  events={calendarEvents}
                  eventContent={renderEventContent}
                  eventClick={(clickInfo) => {
                    const event = clickInfo.event as unknown as CalendarEvent;
                    setSelectedCalendarEvent(event);
                    const rect = clickInfo.el.getBoundingClientRect();
                    setEventPopoverPosition({ x: rect.left, y: rect.bottom + window.scrollY });
                  }}
                  height="auto"
                  editable={false}
                  selectable={false}
                  dayMaxEventRows={3}
                  moreLinkClick="popover"
                />
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Regular Schedule</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Additional Schedule</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Details Popover */}
      {
        selectedCalendarEvent && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setSelectedCalendarEvent(null);
                setEventPopoverPosition(null);
              }}
            />
            <div
              className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm"
              style={{
                top: eventPopoverPosition?.y || 0,
                left: eventPopoverPosition?.x || 0,
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Event Details
                </h4>
                <button
                  onClick={() => {
                    setSelectedCalendarEvent(null);
                    setEventPopoverPosition(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">BP Code:</span>
                  <p className="text-sm text-gray-800 dark:text-white font-medium">
                    {selectedCalendarEvent.extendedProps.bpCode}
                  </p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Type:</span>
                  <p className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedCalendarEvent.extendedProps.arrivalType === 'regular'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                      {selectedCalendarEvent.extendedProps.arrivalType === 'regular' ? 'Regular' : 'Additional'}
                    </span>
                  </p>
                </div>

                {selectedCalendarEvent.start && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Time:</span>
                    <p className="text-sm text-gray-800 dark:text-white">
                      {typeof selectedCalendarEvent.start === 'string'
                        ? new Date(selectedCalendarEvent.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : selectedCalendarEvent.start instanceof Date
                          ? selectedCalendarEvent.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                          : '-'
                      }
                      {selectedCalendarEvent.end && (
                        typeof selectedCalendarEvent.end === 'string'
                          ? ` - ${new Date(selectedCalendarEvent.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                          : selectedCalendarEvent.end instanceof Date
                            ? ` - ${selectedCalendarEvent.end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                            : ''
                      )}
                    </p>
                  </div>
                )}

                {selectedCalendarEvent.extendedProps.dock && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Dock:</span>
                    <p className="text-sm text-gray-800 dark:text-white">
                      {selectedCalendarEvent.extendedProps.dock}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )
      }

      {/* DN List Popup */}
      {
        selectedDNData && (
          <DNListPopup
            isOpen={isPopupOpen}
            onClose={() => setIsPopupOpen(false)}
            dnList={selectedDNData.dnList}
            supplier={selectedDNData.supplier}
            platNumber={selectedDNData.platNumber}
          />
        )
      }
    </div >
  );
}

// Render event content for calendar - simplified to show only bp_code
const renderEventContent = (eventInfo: any) => {
  const event = eventInfo.event;
  const bpCode = event.extendedProps.bpCode;
  const arrivalType = event.extendedProps.arrivalType;

  // Determine color based on arrival type
  const colorClass = arrivalType === 'regular' ? 'fc-bg-primary' : 'fc-bg-success';

  return (
    <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm cursor-pointer hover:opacity-80 transition-opacity`}>
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-title truncate">{bpCode}</div>
    </div>
  );
};
