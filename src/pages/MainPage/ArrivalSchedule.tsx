import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne, { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";

// Data untuk dashboard
const dashboardData = [
  {
    no: 1,
    supplier: "PT Mitra Jaya",
    schedule: "08:00",
    dock: "A-01",
    platNumber: "B 1234 XYZ",
    securityTimeIn: "07:55",
    securityTimeOut: "10:30",
    securityDuration: "2h 35m",
    warehouseTimeIn: "08:10",
    warehouseTimeOut: "10:15",
    warehouseDuration: "2h 5m",
    dnNumber: "DN-2025-001",
    quantityDN: 500,
    quantityActual: 500,
    status: "Completed",
    pic: "John Doe"
  },
  {
    no: 2,
    supplier: "CV Sumber Makmur",
    schedule: "09:00",
    dock: "A-02",
    platNumber: "B 5678 ABC",
    securityTimeIn: "08:50",
    securityTimeOut: "11:20",
    securityDuration: "2h 30m",
    warehouseTimeIn: "09:05",
    warehouseTimeOut: "11:10",
    warehouseDuration: "2h 5m",
    dnNumber: "DN-2025-002",
    quantityDN: 300,
    quantityActual: 295,
    status: "Completed",
    pic: "Jane Smith"
  },
  {
    no: 3,
    supplier: "PT Cahaya Sejahtera",
    schedule: "10:00",
    dock: "B-01",
    platNumber: "B 9012 DEF",
    securityTimeIn: "09:45",
    securityTimeOut: "-",
    securityDuration: "-",
    warehouseTimeIn: "10:00",
    warehouseTimeOut: "-",
    warehouseDuration: "-",
    dnNumber: "DN-2025-003",
    quantityDN: 450,
    quantityActual: 0,
    status: "In Progress",
    pic: "Mike Johnson"
  },
  {
    no: 4,
    supplier: "PT Global Logistics",
    schedule: "11:00",
    dock: "B-02",
    platNumber: "B 3456 GHI",
    securityTimeIn: "10:55",
    securityTimeOut: "13:45",
    securityDuration: "2h 50m",
    warehouseTimeIn: "11:10",
    warehouseTimeOut: "13:30",
    warehouseDuration: "2h 20m",
    dnNumber: "DN-2025-004",
    quantityDN: 600,
    quantityActual: 600,
    status: "Completed",
    pic: "Sarah Lee"
  },
  {
    no: 5,
    supplier: "CV Karya Mandiri",
    schedule: "13:00",
    dock: "A-03",
    platNumber: "B 7890 JKL",
    securityTimeIn: "12:50",
    securityTimeOut: "15:30",
    securityDuration: "2h 40m",
    warehouseTimeIn: "13:05",
    warehouseTimeOut: "15:20",
    warehouseDuration: "2h 15m",
    dnNumber: "DN-2025-005",
    quantityDN: 350,
    quantityActual: 350,
    status: "Completed",
    pic: "David Chen"
  }
];

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
    label: "Security Time (In)",
    sortable: false,
  },
  {
    key: "securityTimeOut",
    label: "Security Time (Out)",
    sortable: false,
  },
  {
    key: "securityDuration",
    label: "Duration",
    sortable: false,
  },
  {
    key: "warehouseTimeIn",
    label: "Warehouse Time (In)",
    sortable: false,
  },
  {
    key: "warehouseTimeOut",
    label: "Warehouse Time (Out)",
    sortable: false,
  },
  {
    key: "warehouseDuration",
    label: "Duration",
    sortable: false,
  },
  {
    key: "dnNumber",
    label: "DN Number",
    sortable: true,
  },
  {
    key: "quantityDN",
    label: "Quantity (DN)",
    sortable: true,
  },
  {
    key: "quantityActual",
    label: "Quantity (Actual)",
    sortable: true,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (value) => {
      const statusColors: Record<string, string> = {
        "Completed": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        "Pending": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      };
      
      return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[value] || "bg-gray-100 text-gray-800"}`}>
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

export default function ArrivalSchedule() {
  return (
    <div className="overflow-x-hidden">
      <PageMeta
        title="Arrival Schedule | SPHERE by SANOH Indonesia"
        description="This is React.js Data Tables Arrival Schedule page for SPHERE by SANOH Indonesia"
      />
      <PageBreadcrumb pageTitle="Arrival Schedule" />
      <div className="space-y-5 sm:space-y-6 mb-5">
            <DataTableOne 
            title="Regular Arrival"
            data={dashboardData}
            columns={columns}
            defaultItemsPerPage={10}
            itemsPerPageOptions={[5, 10, 15, 20]}
            defaultSortKey="no"
            defaultSortOrder="asc"
            searchable={true}
            searchPlaceholder="Search suppliers, DN numbers..."
            datePicker={true}
            />
        </div>
        <div className="space-y-5 sm:space-y-6">
            <DataTableOne 
            title="Additional Arrival"
            data={dashboardData}
            columns={columns}
            defaultItemsPerPage={10}
            itemsPerPageOptions={[5, 10, 15, 20]}
            defaultSortKey="no"
            defaultSortOrder="asc"
            searchable={true}
            searchPlaceholder="Search suppliers, DN numbers..."
            datePicker={true}
            />
        </div>  
    </div>
  );
}