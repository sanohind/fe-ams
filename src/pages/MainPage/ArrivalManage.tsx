import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Edit, Trash2 } from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne from "../../components/tables/DataTables/TableOne/DataTableOne";
import { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import apiService from "../../services/api";

// Interface untuk data arrival management
type ScheduleType = 'regular' | 'additional';

interface ArrivalManageData {
  id: number;
  bp_code: string;
  arrival_type: ScheduleType;
  arrival_time: string; // HH:mm:ss
  departure_time?: string | null;
  day_name: string; // monday..sunday or null when additional
  schedule_date?: string | null; // YYYY-MM-DD for additional
  dock?: string | null;
  created_at: string;
  updated_at: string;
}

export default function ArrivalManage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ArrivalManageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getArrivalManageList();
      if (res.success && res.data) {
        setData(res.data as ArrivalManageData[]);
      } else {
        setError(res.message || "Failed to load schedules");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (id: number) => {
    // Handle edit functionality
    console.log("Edit arrival:", id);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteArrivalSchedule(id);
      setData((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNew = () => {
    navigate("/add-arrival");
  };

  const columns: ColumnConfig[] = useMemo(() => [
    {
      key: "id",
      label: "ID",
      sortable: true,
    },
    {
      key: "bp_code",
      label: "Supplier Code",
      sortable: true,
    },
    {
      key: "arrival_time",
      label: "Arrival",
      sortable: true,
    },
    {
      key: "day_name",
      label: "Day",
      sortable: true,
    },
    {
      key: "dock",
      label: "Dock",
      sortable: true,
    },
    {
      key: "arrival_type",
      label: "Type",
      sortable: true,
      render: (value: string) => {
        const colors: Record<string, string> = {
          regular: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          additional: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        };
        const label = value.charAt(0).toUpperCase() + value.slice(1);
        return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${colors[value] || "bg-gray-100 text-gray-800"}`}>{label}</span>;
      },
    },
    {
      key: "created_at",
      label: "Created Date",
      sortable: true,
    },
    {
      key: "updated_at",
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
  ], []);

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
        {loading && <div className="text-sm text-gray-500">Loading...</div>}
        {error && <div className="text-sm text-red-500">{error}</div>}
      </div>
    </>
  );
}
