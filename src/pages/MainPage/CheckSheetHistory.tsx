import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Checkbox from "../../components/form/input/Checkbox";
import Badge from "../../components/ui/badge/Badge";
import Pagination from "../../components/tables/DataTables/TableThree/Pagination";
import Button from "../../components/ui/button/Button";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DatePicker from "../../components/form/date-picker";
import { SkeletonDataTable } from "../../components/ui/skeleton/Skeleton";
import apiService from "../../services/api";
import { useToast } from "../../hooks/useToast";

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
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
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

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(
      (item) =>
        item.dn_number?.toLowerCase().includes(term) ||
        item.supplier_name?.toLowerCase().includes(term) ||
        item.bp_code?.toLowerCase().includes(term) ||
        item.driver_name?.toLowerCase().includes(term) ||
        item.vehicle_plate?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const newRowsPerPage = parseInt(e.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

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
      setSelectedItems(new Set(filteredData.map((item) => getRowKey(item))));
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
    filteredData.length > 0 &&
    filteredData.every((item) => selectedItems.has(getRowKey(item)));

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
                      setCurrentPage(1);
                    } else if (dateStr) {
                      setSelectedDate(dateStr);
                      setCurrentPage(1);
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
        <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
          <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-gray-500 dark:text-gray-400"> Show </span>
              <div className="relative z-20 bg-transparent">
                <select
                  className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                >
                  <option
                    value="10"
                    className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                  >
                    10
                  </option>
                  <option
                    value="20"
                    className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                  >
                    20
                  </option>
                  <option
                    value="50"
                    className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                  >
                    50
                  </option>
                </select>
                <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
                  <svg
                    className="stroke-current"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                      stroke=""
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
              <span className="text-gray-500 dark:text-gray-400"> entries </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <button className="absolute text-gray-500 -translate-y-1/2 left-4 top-1/2 dark:text-gray-400">
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
                      d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                      fill=""
                    />
                  </svg>
                </button>

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search..."
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
                />
              </div>
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
            </div>
          </div>

          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                    >
                      <div className="flex items-center justify-between cursor-pointer">
                        <div className="flex gap-3">
                          <Checkbox
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                          />
                          <span className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                            DN Number
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                    >
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        Supplier
                      </p>
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                    >
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        Scheduled Time
                      </p>
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                    >
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        Actual Arrival
                      </p>
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                    >
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        DN Qty
                      </p>
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                    >
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        Actual Qty
                      </p>
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                    >
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        Dock
                      </p>
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                    >
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        Label Part
                      </p>
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                    >
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        COA/MSDS
                      </p>
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                    >
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        Packing
                      </p>
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                    >
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        Receiving PIC
                      </p>
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/[0.05]">
                        No check sheet history found for this date
                      </TableCell>
                      <TableCell className="px-4 py-8 border border-gray-100 dark:border-white/[0.05]">-</TableCell>
                      <TableCell className="px-4 py-8 border border-gray-100 dark:border-white/[0.05]">-</TableCell>
                      <TableCell className="px-4 py-8 border border-gray-100 dark:border-white/[0.05]">-</TableCell>
                      <TableCell className="px-4 py-8 border border-gray-100 dark:border-white/[0.05]">-</TableCell>
                      <TableCell className="px-4 py-8 border border-gray-100 dark:border-white/[0.05]">-</TableCell>
                      <TableCell className="px-4 py-8 border border-gray-100 dark:border-white/[0.05]">-</TableCell>
                      <TableCell className="px-4 py-8 border border-gray-100 dark:border-white/[0.05]">-</TableCell>
                      <TableCell className="px-4 py-8 border border-gray-100 dark:border-white/[0.05]">-</TableCell>
                      <TableCell className="px-4 py-8 border border-gray-100 dark:border-white/[0.05]">-</TableCell>
                      <TableCell className="px-4 py-8 border border-gray-100 dark:border-white/[0.05]">-</TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((item) => (
                      <TableRow key={getRowKey(item)}>
                        <TableCell className="px-4 py-4 border border-gray-100 dark:border-white/[0.05] dark:text-white/90 whitespace-nowrap">
                          <div className="flex gap-3">
                            <div className="mt-1">
                              <Checkbox
                                checked={selectedItems.has(getRowKey(item))}
                                onChange={(checked) =>
                                  handleSelectItem(item, checked)
                                }
                              />
                            </div>
                            <div>
                              <p className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {item.dn_number || "-"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                          <div>
                            <p className="font-medium">{item.supplier_name}</p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {item.bp_code}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                          {item.schedule || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                          {item.actual_arrival_time || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                          {item.total_qty_dn !== null ? item.total_qty_dn.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                          {item.actual_qty !== null ? item.actual_qty.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                          {item.dock || "-"}
                        </TableCell>
                        <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                          {getStatusBadge(item.label_part_status)}
                        </TableCell>
                        <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                          {getStatusBadge(item.coa_msds_status)}
                        </TableCell>
                        <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                          {getStatusBadge(item.packing_condition_status)}
                        </TableCell>
                        <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                          {item.pic_name || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
              <div className="pb-3 xl:pb-0">
                <p className="pb-3 text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
                  Showing {startIndex + 1} to {endIndex} of {filteredData.length}{" "}
                  entries
                </p>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

