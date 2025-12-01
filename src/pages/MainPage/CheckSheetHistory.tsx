import { useEffect, useState, useMemo, useCallback } from "react";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DatePicker from "../../components/form/date-picker";
import { SkeletonDataTable } from "../../components/ui/skeleton/Skeleton";
import apiService from "../../services/api";
import { useToast } from "../../hooks/useToast";
import DataTableThree, { ColumnConfig } from "../../components/tables/DataTables/TableThree/DataTableThree";
import Checkbox from "../../components/form/input/Checkbox";

interface CheckSheetHistoryData {
  id: number | null;
  session_id: number | null;
  arrival_id: number | null;
  row_number: number;
  dn_number: string | null;
  supplier_name: string;
  bp_code: string;
  schedule: string | null;
  actual_arrival_time: string | null;
  driver_name: string | null;
  vehicle_plate: string | null;
  dock: string | null;
  label_part_status: string;
  coa_msds_status: string;
  packing_condition_status: string;
  session_start: string | null;
  session_end: string | null;
  plan_delivery_date: string | null;
  total_qty_dn: number | null;
  actual_qty: number | null;
  pic_name: string | null;
}

export default function CheckSheetHistory() {
  const [data, setData] = useState<CheckSheetHistoryData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getCheckSheetHistory(selectedDate);
      if (res.success && res.data) {
        const responseData = res.data as { history?: CheckSheetHistoryData[] };
        setData((responseData.history || []) as CheckSheetHistoryData[]);
      } else {
        setError(res.message || "Failed to fetch check sheet history");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to fetch check sheet history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);


  const getRowKey = useCallback((item: CheckSheetHistoryData) => {
    return [
      item.id ?? "no-id",
      item.session_id ?? "no-session",
      item.arrival_id ?? "no-arrival",
      item.row_number ?? "no-row",
    ].join("-");
  }, []);

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(data.map((item) => getRowKey(item))));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (
    item: CheckSheetHistoryData,
    checked: boolean
  ) => {
    const rowKey = getRowKey(item);
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(rowKey);
    } else {
      newSelected.delete(rowKey);
    }
    setSelectedItems(newSelected);
  };

  const isAllSelected =
    data.length > 0 &&
    data.every((item) => selectedItems.has(getRowKey(item)));

  const isItemSelected = useCallback(
    (item: CheckSheetHistoryData) => {
      return selectedItems.has(getRowKey(item));
    },
    [selectedItems, getRowKey]
  );

  // Download CSV handler (kept for future use if needed)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  const handleDownloadCsv = () => {
    if (selectedItems.size === 0) {
      alert("Please select at least one item to download");
      return;
    }

    const selectedData = data.filter((item) =>
      selectedItems.has(getRowKey(item))
    );
    // Convert to CSV
    const headers = [
      "No",
      "Supplier",
      "BP Code",
      "Rencana Jam Datang",
      "Actual Jam Datang",
      "Nomor Surat Jalan",
      "Total Qty SJ",
      "Actual Qty",
      "Label Part",
      "COA/MSDS",
      "Packing",
      "PIC Penerima",
    ];

    const rows = selectedData.map((item) => [
      item.row_number,
      item.supplier_name,
      item.bp_code,
      item.schedule || "-",
      item.actual_arrival_time || "-",
      item.dn_number || "-",
      item.total_qty_dn !== null ? item.total_qty_dn : "-",
      item.actual_qty !== null ? item.actual_qty : "-",
      item.label_part_status,
      item.coa_msds_status,
      item.packing_condition_status,
      item.pic_name || "-",
    ]);

    const csvContent =
      headers.join(",") +
      "\n" +
      rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `check-sheet-history-${selectedDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // Keep reference for future CSV feature (prevents unused-var lint)
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  void handleDownloadCsv;

  // Download PDF handler
  const handleDownloadPdf = async () => {
    if (selectedItems.size === 0) {
      toast.warning("Please select at least one DN to download as PDF.", {
        title: "Selection Required",
      });
      return;
    }

    try {
      setDownloadingPdf(true);
      const selectedRowNumbers = data
        .filter((item) => selectedItems.has(getRowKey(item)))
        .map((item) => item.row_number)
        .filter((rowNumber): rowNumber is number => typeof rowNumber === "number")
        .sort((a, b) => a - b);
      await apiService.downloadCheckSheetPdf(selectedDate, {
        selectedRows: selectedRowNumbers,
      });
    } catch (e: any) {
      console.error('PDF Download Error:', e);
      const errorMessage = e?.message || "Failed to download PDF";
      toast.error(
        `${errorMessage}\nIf PDF library is unavailable, HTML preview will open in a new window.`,
        {
        title: "Download Failed",
        autoClose: 5000,
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getStatusBadge = (status: string) => {
    // If PENDING, show dash
    if (status === 'PENDING' || !status) {
      return <span className="text-gray-500 dark:text-gray-400">-</span>;
    }

    const statusColors: Record<string, { color: string; label: string }> = {
      OK: { color: "success", label: "OK" },
      NOT_OK: { color: "error", label: "NOT OK" },
    };

    const statusInfo = statusColors[status] || {
      color: "error",
      label: status,
    };

    return (
      <Badge size="sm" color={statusInfo.color as any}>
        {statusInfo.label}
      </Badge>
    );
  };

  const columns: ColumnConfig[] = useMemo(() => [
    {
      key: "dn_number",
      label: "DN Number",
      render: (value: string, row: CheckSheetHistoryData) => (
        <div className="flex gap-3">
          <div className="mt-1">
            <Checkbox
              checked={isItemSelected(row)}
              onChange={(checked) => handleSelectItem(row, checked)}
            />
          </div>
          <div>
            <p className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {value || "-"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "supplier_name",
      label: "Supplier",
      render: (value: string, row: CheckSheetHistoryData) => (
        <div>
          <p className="font-medium">{value}</p>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {row.bp_code}
          </span>
        </div>
      ),
    },
    {
      key: "schedule",
      label: "Scheduled Time",
    },
    {
      key: "actual_arrival_time",
      label: "Actual Arrival",
    },
    {
      key: "total_qty_dn",
      label: "DN Qty",
      render: (value: number | null) => (
        <span className="font-normal text-gray-800 text-theme-sm dark:text-white/90">
          {value !== null ? value.toLocaleString() : "-"}
        </span>
      ),
    },
    {
      key: "actual_qty",
      label: "Actual Qty",
      render: (value: number | null) => (
        <span className="font-normal text-gray-800 text-theme-sm dark:text-white/90">
          {value !== null ? value.toLocaleString() : "-"}
        </span>
      ),
    },
    {
      key: "dock",
      label: "Dock",
    },
    {
      key: "label_part_status",
      label: "Label Part",
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: "coa_msds_status",
      label: "COA/MSDS",
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: "packing_condition_status",
      label: "Packing",
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: "pic_name",
      label: "Receiving PIC",
    },
  ], [isItemSelected, handleSelectItem]);

  return (
    <div className="overflow-x-hidden space-y-5 sm:space-y-6">
      <PageMeta
        title="Check Sheet History | SPHERE by SANOH Indonesia"
        description="Check sheet history page for SPHERE by SANOH Indonesia"
      />
      <PageBreadcrumb 
        pageTitle="Check Sheet History"
        breadcrumbs={[
          { label: "Home", path: "/" },
          { label: "Check Sheet", path: "/checksheet" },
          { label: "Check Sheet History" },
        ]}
      />

      {loading ? (
        <>
          {/* Date Picker Skeleton */}
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-4">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="w-full sm:w-[250px] h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Table Skeleton */}
          <SkeletonDataTable rows={5} columns={11} showTitle={true} />
        </>
      ) : (
        <>
          {/* Date Picker */}
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Date:
              </label>
              <div className="w-full sm:w-[250px]">
                <DatePicker
                  id="check-sheet-history-date-picker"
                  mode="single"
                  placeholder="Select date"
                  defaultDate={selectedDate}
                  onChange={(selectedDates, dateStr) => {
                    if (selectedDates && selectedDates.length > 0) {
                      const date = selectedDates[0];
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      const day = String(date.getDate()).padStart(2, "0");
                      const formattedDate = `${year}-${month}-${day}`;
                      setSelectedDate(formattedDate);
                    } else if (dateStr) {
                      setSelectedDate(dateStr);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}
        </>
      )}

      {!loading && !error && (
        <DataTableThree
          data={data}
          columns={columns}
          defaultItemsPerPage={10}
          itemsPerPageOptions={[10, 20, 50]}
          searchable={true}
          searchPlaceholder="Search DN numbers, supplier, driver..."
          onSelectAll={handleSelectAll}
          isAllSelected={isAllSelected}
          getRowKey={getRowKey}
          actionButton={
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? "Downloading..." : "Download PDF"}
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
          }
          emptyStateMessage="No check sheet history found for this date"
        />
      )}
    </div>
  );
}

