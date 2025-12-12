import { useEffect, useState } from "react";
import DataTableOne from "../../components/tables/DataTables/TableOne/DataTableOne";
import { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import ConfirmationPopup from "../../components/popups/ConfirmationPopup";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import { useToast } from "../../hooks/useToast";
import apiService from "../../services/api";

interface ArrivalRow {
  no: number;
  supplier: string;
  driverName: string;
  platNo: string;
  status: "Waiting" | "Checked In" | "Checked Out";
  groupKey: string;
  arrivalIds: number[];
  arrivalType: "regular" | "additional";
}

export default function DriverCheck() {
  const toast = useToast();
  const [rows, setRows] = useState<ArrivalRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ArrivalRow | null>(null);
  const [mode, setMode] = useState<"checkin" | "checkout">("checkin");
  const [confirmationMode, setConfirmationMode] = useState<
    "checkin" | "checkout" | null
  >(null);
  const [selectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getArrivalCheckList({
        date: selectedDate,
        type: mode,
      }, true);
      if (res.success) {
        const arrivalsData =
          (res.data as { arrivals?: any[] } | undefined)?.arrivals || [];
        const list = arrivalsData as any[];
        const mapped: ArrivalRow[] = list.map((g: any, idx: number) => ({
          no: idx + 1,
          supplier: g.supplier_name || g.bp_code || "-",
          driverName:
            g.driver_name || (g.arrival_type === "additional" ? "N/A" : "-"),
          platNo:
            g.vehicle_plate || (g.arrival_type === "additional" ? "N/A" : "-"),
          status:
            mode === "checkin"
              ? g.warehouse_checkin_time
                ? "Checked In"
                : "Waiting"
              : g.warehouse_checkout_time
              ? "Checked Out"
              : "Checked In",
          groupKey: g.group_key,
          arrivalIds: g.arrival_ids || [],
          arrivalType: g.arrival_type || "regular",
        }));
        setRows(mapped);
      } else {
        setError(res.message || "Failed to load data");
      }
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedDate]);

  const handleCheckIn = (row: ArrivalRow) => {
    setSelectedRow(row);
    setConfirmationMode("checkin");
    setShowModal(true);
  };

  const handleCheckOut = (row: ArrivalRow) => {
    setSelectedRow(row);
    setConfirmationMode("checkout");
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedRow || !confirmationMode) return;

    try {
      setLoading(true);
      setError(null);

      if (confirmationMode === "checkin") {
        await apiService.arrivalCheckin(selectedRow.arrivalIds, true);
        toast.success("Check-in successful!", { title: "Success" });
      } else {
        await apiService.arrivalCheckout(selectedRow.arrivalIds, true);
        toast.success("Check-out successful!", { title: "Success" });
      }

      await fetchData();
    } catch (e: any) {
      const message =
        e?.response?.data?.message || e?.message || "Operation failed";
      setError(message);
      toast.error(message, { title: "Error" });
    } finally {
      setLoading(false);
      setSelectedRow(null);
      setConfirmationMode(null);
      setShowModal(false);
    }
  };

  const cancelAction = () => {
    setShowModal(false);
    setSelectedRow(null);
    setConfirmationMode(null);
  };

  const isCheckinTab = mode === "checkin";
  const actionLabel = isCheckinTab ? "Check In" : "Check Out";
  const modalTitle =
    confirmationMode === "checkout"
      ? "Konfirmasi Check Out"
      : "Konfirmasi Check In";
  const modalMessage =
    confirmationMode === "checkout"
      ? `Apakah Anda yakin ingin melakukan check out untuk driver ${selectedRow?.driverName} dengan plat nomor ${selectedRow?.platNo}?`
      : `Apakah Anda yakin ingin melakukan check in untuk driver ${selectedRow?.driverName} dengan plat nomor ${selectedRow?.platNo}?`;
  const confirmText =
    confirmationMode === "checkout" ? "Ya, Check Out" : "Ya, Check In";
  const searchPlaceholder = isCheckinTab
    ? "Search Driver Name..."
    : "Search Checked-In Driver...";

  const columns: ColumnConfig[] = [
    {
      key: "no",
      label: "No",
      sortable: true,
    },
    { key: "driverName", label: "Driver Name", sortable: true },
    {
      key: "platNo",
      label: "Plat No",
      sortable: true,
    },
    {
      key: "supplier",
      label: "Supplier",
      sortable: true,
      render: (_value: any, row: ArrivalRow) => (
        <div className="flex items-center gap-2">
          <span className="text-gray-900 dark:text-white text-theme-sm">{row.supplier}</span>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              row.arrivalType === "additional"
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            }`}
          >
            {row.arrivalType === "additional" ? "Additional" : "Regular"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
            value === "Checked In"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      sortable: false,
      render: (_value: any, row: ArrivalRow) => (
        <button
          onClick={() =>
            isCheckinTab ? handleCheckIn(row) : handleCheckOut(row)
          }
          disabled={
            loading ||
            (isCheckinTab
              ? row.status === "Checked In"
              : row.status !== "Checked In")
          }
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            loading ||
            (isCheckinTab && row.status === "Checked In") ||
            (!isCheckinTab && row.status !== "Checked In")
              ? "cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-500"
              : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
          }`}
        >
          {actionLabel}
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 relative">
      {/* Floating Theme Toggle Button */}
      <div className="fixed z-50 bottom-6 right-6">
        <ThemeTogglerTwo />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Driver Check-In / Check-Out
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Warehouse arrival management for drivers
          </p>
        </div>

        <div className="space-y-5 sm:space-y-6">
          <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            <button
              onClick={() => {
                if (mode !== "checkin") {
                  setMode("checkin");
                  setRows([]);
                  setError(null);
                }
              }}
              className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm transition-colors ${
                isCheckinTab
                  ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Warehouse Check-In
            </button>
            <button
              onClick={() => {
                if (mode !== "checkout") {
                  setMode("checkout");
                  setRows([]);
                  setError(null);
                }
              }}
              className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm transition-colors ${
                mode === "checkout"
                  ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Warehouse Check-Out
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <DataTableOne
            title={isCheckinTab ? "Driver Check In" : "Driver Check Out"}
            data={rows}
            columns={columns}
            defaultItemsPerPage={10}
            itemsPerPageOptions={[5, 10, 15, 20]}
            defaultSortKey="no"
            defaultSortOrder="asc"
            searchable={true}
            searchPlaceholder={searchPlaceholder}
          />
        </div>

        {/* Confirmation Modal */}
        <ConfirmationPopup
          isOpen={showModal}
          onClose={cancelAction}
          onConfirm={confirmAction}
          title={modalTitle}
          message={modalMessage}
          confirmText={confirmText}
          cancelText="Batal"
          variant="primary"
        />
      </div>
    </div>
  );
}

