import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne from "../../components/tables/DataTables/TableOne/DataTableOne";
import { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import ConfirmationPopup from "../../components/popups/ConfirmationPopup";

interface DriverData {
  no: number;
  driverName: string;
  platNo: string;
  supplier: string;
  status: "Waiting" | "Checked In";
}

const initialData: DriverData[] = [
    {
        no: 1,
        driverName: "John Doe",
        platNo: "B 1234 XYZ",
        supplier: "PT. Mitra Jaya",
        status: "Waiting",
    },
    {
        no: 2,
        driverName: "Jane Smith",    
        platNo: "B 5678 ABC",
        supplier: "PT. Sejahtera Abadi",
        status: "Waiting",
    },
    {
        no: 3,
        driverName: "Mike Johnson",
        platNo: "B 9012 DEF",
        supplier: "PT. Cahaya Baru",
        status: "Waiting",
    },
];

export default function ArrivalCheck() {
  const [data, setData] = useState<DriverData[]>(initialData);
  const [showModal, setShowModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null);

  const handleCheckIn = (driver: DriverData) => {
    setSelectedDriver(driver);
    setShowModal(true);
  };

  const confirmCheckIn = () => {
    if (selectedDriver) {
      setData((prevData) =>
        prevData.map((item) =>
          item.no === selectedDriver.no
            ? { ...item, status: "Checked In" }
            : item
        )
      );
    }
    setSelectedDriver(null);
  };

  const cancelCheckIn = () => {
    setShowModal(false);
    setSelectedDriver(null);
  };

  const columns: ColumnConfig[] = [
    {
        key: "no",
        label: "No",
        sortable: true,
    },
    {
        key: "driverName",
        label: "Driver Name",
        sortable: true,
    },
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
        render: (_value: any, row: DriverData) => (
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
          data={data}
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