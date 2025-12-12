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

const stackedHeaderLabel = (top: string, bottom: string) => (
  <span className="flex flex-col leading-tight text-center">
    <span>{top}</span>
    <span>{bottom}</span>
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
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState<CalendarEvent | null>(null);
  const [eventPopoverPosition, setEventPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [downloadingReport, setDownloadingReport] = useState(false);

  // Check if selected date is not today
  const isNotToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate !== today;
  };

  // Download daily report
  const handleDownloadReport = async () => {
    try {
      setDownloadingReport(true);
      const response = await apiService.downloadDailyReport(selectedDate);

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily-report-${selectedDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading report:', err);
      alert('Failed to download daily report. Please try again.');
    } finally {
      setDownloadingReport(false);
    }
  };

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch schedule data for selected date
        const response = await apiService.getScheduleData(selectedDate);

        if (response.success && response.data) {
          // Transform API data to match our interface
          const data = response.data as any;
          const regular = transformApiDataToDashboard(data.regular_arrivals || []);
          const additional = transformApiDataToDashboard(data.additional_arrivals || []);
          setRegularData(regular);
          setAdditionalData(additional);
        } else {
          setError(response.message || 'Failed to fetch schedule data');
        }
      } catch (err: any) {
        console.error('Error fetching schedule data:', err);
        setError(err.message || 'Failed to fetch schedule data');
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, [selectedDate]);

  // Fetch calendar schedule data
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

  // Konfigurasi kolom
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
      label: "Plat Number",
      sortable: true,
    },
    {
      key: "securityTimeIn",
      label: stackedHeaderLabel("Security", "Time (In)"),
      sortable: false,
    },
    {
      key: "securityTimeOut",
      label: stackedHeaderLabel("Security", "Time (Out)"),
      sortable: false,
    },
    {
      key: "securityDuration",
      label: "Duration",
      sortable: false,
      render: (value) => renderDurationCell(value as string | number | null),
    },
    {
      key: "warehouseTimeIn",
      label: stackedHeaderLabel("Warehouse", "Time (In)"),
      sortable: false,
    },
    {
      key: "warehouseTimeOut",
      label: stackedHeaderLabel("Warehouse", "Time (Out)"),
      sortable: false,
    },
    {
      key: "warehouseDuration",
      label: "Duration",
      sortable: false,
      render: (value) => renderDurationCell(value as string | number | null),
    },
    {
      key: "arrivalStatus",
      label: "Arrival Status",
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
      label: "Quantity (DN)",
      sortable: true,
      render: (_value, row: any) => {
        const qty = row.quantity_dn || (row.dnList as DNItem[])?.reduce((sum, dn) => sum + dn.quantityDN, 0) || 0;
        return <span className=" dark:text-white">{qty.toLocaleString()}</span>;
      }
    },
    {
      key: "quantity_actual",
      label: "Quantity (Actual)",
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
      key: "labelPart",
      label: "Label Part",
      sortable: false,
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

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading schedule data
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Picker and Download Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Date:
          </label>
          <div className="w-full sm:w-[250px]">
            <DatePicker
              id="arrival-schedule-date-picker"
              mode="single"
              placeholder="Select date"
              defaultDate={selectedDate}
              onChange={(selectedDates, dateStr) => {
                // flatpickr onChange hook signature: (selectedDates, dateStr, instance)
                if (selectedDates && selectedDates.length > 0) {
                  const date = selectedDates[0];
                  // Format date in local timezone to avoid timezone offset issues
                  // Using local date methods instead of toISOString() which uses UTC
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const formattedDate = `${year}-${month}-${day}`;
                  setSelectedDate(formattedDate);
                } else if (dateStr) {
                  // dateStr sudah dalam format Y-m-d (sesuai dateFormat di DatePicker)
                  setSelectedDate(dateStr);
                }
              }}
            />
          </div>
        </div>

        {/* Download Daily Report Button */}
        {isNotToday() && (
  <Button
    variant="outline"
    size="sm"
    onClick={handleDownloadReport}
    disabled={downloadingReport}
  >
    {downloadingReport ? "Downloading..." : "Download Report"}
    <svg
      className="fill-current"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.0018 14.083C9.7866 14.083 9.59255 13.9924 9.45578 13.8472L5.61586 10.0097C5.32288 9.71688 5.32272 9.242 5.61552 8.94902C5.90832 8.65603 6.3832 8.65588 6.67618 8.94868L9.25182 11.5227L9.25182 3.33301C9.25182 2.91879 9.5876 2.58301 10.0018 2.58301C10.416 2.58301 10.7518 2.91879 10.7518 3.33301L10.7518 11.5193L13.3242 8.94866C13.6172 8.65587 14.0921 8.65604 14.3849 8.94903C14.6777 9.24203 14.6775 9.7169 14.3845 10.0097L10.5761 13.8154C10.4385 13.979 10.2323 14.083 10.0018 14.083ZM4.0835 13.333C4.0835 12.9188 3.74771 12.583 3.3335 12.583C2.91928 12.583 2.5835 12.9188 2.5835 13.333V15.1663C2.5835 16.409 3.59086 17.4163 4.8335 17.4163H15.1676C16.4102 17.4163 17.4176 16.409 17.4176 15.1663V13.333C17.4176 12.9188 17.0818 12.583 16.6676 12.583C16.2533 12.583 15.9176 12.9188 15.9176 13.333V15.1663C15.9176 15.5806 15.5818 15.9163 15.1676 15.9163H4.8335C4.41928 15.9163 4.0835 15.5806 4.0835 15.1663V13.333Z"
        fill="currentColor"
      />
    </svg>
  </Button>
)}
      </div>

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
      {selectedCalendarEvent && (
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
      )}

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
