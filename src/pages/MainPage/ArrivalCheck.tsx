import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne from "../../components/tables/DataTables/TableOne/DataTableOne";
import { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import ConfirmationPopup from "../../components/popups/ConfirmationPopup";
import apiService from "../../services/api";

interface ArrivalRow {
  no: number;
  supplier: string;
  driverName: string;
  platNo: string;
  status: "Waiting" | "Checked In";
  groupKey: string;
  arrivalIds: number[];
}

export default function ArrivalCheck() {
  const [rows, setRows] = useState<ArrivalRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ArrivalRow | null>(null);
  const [mode, setMode] = useState<"checkin"|"checkout">("checkin");
  const [selectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getArrivalCheckList({ date: selectedDate, type: mode });
      if (res.success) {
        const list = (res.data.arrivals || []) as any[];
        // sort by schedule time if available via group key's time portion
        const mapped: ArrivalRow[] = list
          .map((g: any, idx: number) => ({
            no: idx + 1,
            supplier: g.supplier_name || g.bp_code || '-',
            driverName: g.driver_name || '-',
            platNo: g.vehicle_plate || '-',
            status: g.warehouse_checkin_time ? "Checked In" : "Waiting",
            groupKey: g.group_key,
            arrivalIds: g.arrival_ids || [],
          }));
        setRows(mapped);
      } else {
        setError(res.message || 'Failed to load data');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedDate]);

  const handleCheckIn = (row: ArrivalRow) => {
    setSelectedRow(row);
    setMode("checkin");
    setShowModal(true);
  };

  const confirmCheckIn = () => {
    if (!selectedRow) return;
    apiService.arrivalCheckin(selectedRow.arrivalIds).then(() => {
      fetchData();
    });
    setSelectedRow(null);
    setShowModal(false);
  };

  const cancelCheckIn = () => {
    setShowModal(false);
    setSelectedRow(null);
  };

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
            onClick={() => handleCheckIn(row)}
            disabled={row.status === "Checked In"}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              row.status === "Checked In"
                ? "cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-500"
                : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
            }`}
          >
            {row.status === "Checked In" ? "Checked In" : "Check In"}
          </button>
        ),
    },
  ];

  return (
    <>
      <PageMeta
        title="Arrival Check | SPHERE by SANOH Indonesia"
        description="This is React.js Data Tables Dashboard page for SPHERE by SANOH Indonesia"
      />
      <PageBreadcrumb pageTitle="Arrival Check" />
      
      <div className="space-y-5 sm:space-y-6">
        <DataTableOne   
        title="Driver Check In"
          data={rows}
          columns={columns}
          defaultItemsPerPage={10}
          itemsPerPageOptions={[5, 10, 15, 20]}
          defaultSortKey="no"
          defaultSortOrder="asc"
          searchable={true}
          searchPlaceholder="Search Driver Name..."
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmationPopup
        isOpen={showModal}
        onClose={cancelCheckIn}
        onConfirm={confirmCheckIn}
        title="Konfirmasi Check In"
        message={`Apakah Anda yakin ingin melakukan check in untuk driver ${selectedDriver?.driverName} dengan plat nomor ${selectedDriver?.platNo}?`}
        confirmText="Ya, Check In"
        cancelText="Batal"
        variant="primary"
      />
    </>
  );    
}