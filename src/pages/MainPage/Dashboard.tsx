import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne, { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import DNListPopup from "../../components/popups/DNListPopup";
import apiService from "../../services/api";

// Helper function to calculate arrival status
const calculateArrivalStatus = (schedule: string, securityTimeIn: string): string => {
  if (securityTimeIn === "-" || !securityTimeIn) return "-";
  
  const [scheduleHour, scheduleMin] = schedule.split(":").map(Number);
  const [actualHour, actualMin] = securityTimeIn.split(":").map(Number);
  
  const scheduleInMinutes = scheduleHour * 60 + scheduleMin;
  const actualInMinutes = actualHour * 60 + actualMin;
  
  const diffInMinutes = actualInMinutes - scheduleInMinutes;
  
  if (diffInMinutes < -5) return "Advance";
  if (diffInMinutes > 5) return "Delay";
  return "Ontime";
};

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
  pic: string;
}

// Data untuk dashboard dengan multiple DN
const dashboardData: DashboardDataItem[] = [
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
    dnList: [
      { dnNumber: "DN-2025-001", quantityDN: 500, quantityActual: 500, status: "Completed" },
      { dnNumber: "DN-2025-002", quantityDN: 300, quantityActual: 300, status: "Completed" },
      { dnNumber: "DN-2025-003", quantityDN: 200, quantityActual: 195, status: "Completed" }
    ],
    arrivalStatus: calculateArrivalStatus("08:00", "07:55"),
    scanStatus: "Completed",
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
    dnList: [
      { dnNumber: "DN-2025-004", quantityDN: 300, quantityActual: 295, status: "Completed" }
    ],
    arrivalStatus: calculateArrivalStatus("09:00", "08:50"),
    scanStatus: "Completed",
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
    dnList: [
      { dnNumber: "DN-2025-005", quantityDN: 450, quantityActual: 0, status: "In Progress" },
      { dnNumber: "DN-2025-006", quantityDN: 250, quantityActual: 0, status: "Pending" }
    ],
    arrivalStatus: calculateArrivalStatus("10:00", "09:45"),
    scanStatus: "In Progress",
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
    dnList: [
      { dnNumber: "DN-2025-007", quantityDN: 600, quantityActual: 600, status: "Completed" }
    ],
    arrivalStatus: calculateArrivalStatus("11:00", "10:55"),
    scanStatus: "Completed",
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
    dnList: [
      { dnNumber: "DN-2025-008", quantityDN: 150, quantityActual: 150, status: "Completed" },
      { dnNumber: "DN-2025-009", quantityDN: 100, quantityActual: 100, status: "Completed" },
      { dnNumber: "DN-2025-010", quantityDN: 100, quantityActual: 100, status: "Completed" }
    ],
    arrivalStatus: calculateArrivalStatus("13:00", "12:50"),
    scanStatus: "Completed",
    pic: "David Chen"
  }
];

export default function Dashboard() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedDNData, setSelectedDNData] = useState<{
    dnList: DNItem[];
    supplier: string;
    platNumber: string;
  } | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch dashboard stats and metrics
        const [statsResponse, metricsResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getDashboardMetrics()
        ]);

        if (statsResponse.success && metricsResponse.success) {
          // Transform API data to match our interface
          const transformedData = transformApiDataToDashboard(statsResponse.data, metricsResponse.data);
          setDashboardData(transformedData);
        } else {
          // Fallback to dummy data if API fails
          setDashboardData(dashboardData);
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to fetch dashboard data');
        // Fallback to dummy data
        setDashboardData(dashboardData);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleViewDNList = (item: DashboardDataItem) => {
    setSelectedDNData({
      dnList: item.dnList,
      supplier: item.supplier,
      platNumber: item.platNumber
    });
    setIsPopupOpen(true);
  };

  // Transform API data to dashboard format
  const transformApiDataToDashboard = (statsData: any, metricsData: any): DashboardDataItem[] => {
    // This function will transform the API response to match our DashboardDataItem interface
    // For now, return the dummy data structure
    return dashboardData;
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
      key: "arrivalStatus",
      label: "Arrival Status",
      sortable: true,
      render: (value) => {
        const statusColors: Record<string, string> = {
          "Advance": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
          "Ontime": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          "Delay": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        };
        
        if (value === "-") return <span className="text-gray-500">-</span>;
        
        return (
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[value] || "bg-gray-100 text-gray-800"}`}>
            {value}
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
      key: "dnList",
      label: "Quantity (DN)",
      sortable: true,
      render: (value) => {
        const dnList = value as DNItem[];
        const totalQtyDN = dnList.reduce((sum, dn) => sum + dn.quantityDN, 0);
        return <span className=" dark:text-white">{totalQtyDN.toLocaleString()}</span>;
      }
    },
    {
      key: "dnList",
      label: "Quantity (Actual)",
      sortable: true,
      render: (value) => {
        const dnList = value as DNItem[];
        const totalQtyDN = dnList.reduce((sum, dn) => sum + dn.quantityDN, 0);
        const totalQtyActual = dnList.reduce((sum, dn) => sum + dn.quantityActual, 0);
        
        const isMatch = totalQtyDN === totalQtyActual;
        
        return (
          <span className={`font-medium ${
            isMatch 
              ? "text-green-600 dark:text-green-400" 
              : "text-red-600 dark:text-red-400"
          }`}>
            {totalQtyActual.toLocaleString()}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden space-y-5 sm:space-y-6">
      <PageMeta
        title="Dashboard | SPHERE by SANOH Indonesia"
        description="This is React.js Data Tables Dashboard page for SPHERE by SANOH Indonesia"
      />
      <PageBreadcrumb pageTitle="Dashboard" />
      
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
      
      <div className="space-y-5 sm:space-y-6">
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
  );
}