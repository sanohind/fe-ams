import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Edit, Trash2 } from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne from "../../components/tables/DataTables/TableOne/DataTableOne";
import { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";

// Interface untuk data arrival management
interface ArrivalManageData {
  id: number;
  supplier: string;
  schedule: string;
  day: string;
  dock: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
  createdDate: string;
  lastModified: string;
}

export default function ArrivalManage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ArrivalManageData[]>([
    {
      id: 1,
      supplier: "PT. Mitra Jaya",
      schedule: "08:00",
      day: "Monday",
      dock: "A-01",
      frequency: "weekly",
      createdDate: "2025-01-15",
      lastModified: "2025-01-20",
    },
    {
      id: 2,
      supplier: "PT. Sejahtera Abadi",
      schedule: "09:30",
      day: "Wednesday",
      dock: "A-02",
      frequency: "biweekly",
      createdDate: "2025-01-10",
      lastModified: "2025-01-18",
    },
    {
      id: 3,
      supplier: "PT. Cahaya Baru",
      schedule: "10:15",
      day: "Friday",
      dock: "B-01",
      frequency: "daily",
      createdDate: "2025-01-12",
      lastModified: "2025-01-19",
    },
    {
      id: 4,
      supplier: "CV Sumber Makmur",
      schedule: "14:00",
      day: "Tuesday",
      dock: "B-02",
      frequency: "monthly",
      createdDate: "2025-01-08",
      lastModified: "2025-01-17",
    },
    {
      id: 5,
      supplier: "PT Global Logistics",
      schedule: "11:30",
      day: "Thursday",
      dock: "C-01",
      frequency: "weekly",
      createdDate: "2025-01-14",
      lastModified: "2025-01-21",
    },
  ]);

  const handleEdit = (id: number) => {
    // Handle edit functionality
    console.log("Edit arrival:", id);
  };

  const handleDelete = (id: number) => {
    // Handle delete functionality
    setData((prevData) => prevData.filter((item) => item.id !== id));
  };

  const handleAddNew = () => {
    navigate("/add-arrival");
  };

  const columns: ColumnConfig[] = [
    {
      key: "id",
      label: "ID",
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
      key: "day",
      label: "Day",
      sortable: true,
    },
    {
      key: "dock",
      label: "Dock",
      sortable: true,
    },
    {
      key: "frequency",
      label: "Frequency",
      sortable: true,
      render: (value: string) => {
        const frequencyColors: Record<string, string> = {
          daily: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
          weekly: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          biweekly: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
          monthly: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        };

        return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${frequencyColors[value] || "bg-gray-100 text-gray-800"}`}>{value.charAt(0).toUpperCase() + value.slice(1)}</span>;
      },
    },
    {
      key: "createdDate",
      label: "Created Date",
      sortable: true,
    },
    {
      key: "lastModified",
      label: "Last Modified",
      sortable: true,
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_value: unknown, row: ArrivalManageData) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row.id)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Arrival Management | SPHERE by SANOH Indonesia" description="This is React.js Arrival Management page for SPHERE by SANOH Indonesia" />
      <PageBreadcrumb pageTitle="Arrival Management" />

      <div className="space-y-5 sm:space-y-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Add New Arrival
          </button>
        </div>

        {/* Data Table */}
        <DataTableOne
          title="Arrival Schedule List"
          data={data}
          columns={columns}
          defaultItemsPerPage={10}
          itemsPerPageOptions={[5, 10, 15, 20]}
          defaultSortKey="id"
          defaultSortOrder="asc"
          searchable={true}
          searchPlaceholder="Search suppliers, schedules, docks..."
        />
      </div>
    </>
  );
}
