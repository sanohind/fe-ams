import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Edit, Trash2 } from "lucide-react";
import Button from "../../components/ui/button/Button";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne from "../../components/tables/DataTables/TableOne/DataTableOne";
import { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import { SkeletonArrivalManage } from "../../components/ui/skeleton/Skeleton";
import { useToast } from "../../hooks/useToast";
import apiService from "../../services/api";
import ConfirmationPopup from "../../components/popups/ConfirmationPopup";

// Interface untuk data arrival management
type ScheduleType = 'regular' | 'additional';

interface ArrivalManageData {
  id: number;
  bp_code: string;
  bp_name?: string; // Supplier name
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
  const toast = useToast();
  const [data, setData] = useState<ArrivalManageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArrivalManageData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    navigate(`/add-arrival?id=${id}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await apiService.deleteArrivalSchedule(deleteTarget.id);
      setData((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      toast.success('Arrival schedule deleted successfully!', { title: 'Success' });
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to delete schedule';
      toast.error(errorMsg, { title: 'Error' });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleAddNew = () => {
    navigate("/add-arrival");
  };

  const capitalizeDay = (day: string | null) => {
    if (!day) return '-';
    return day.charAt(0).toUpperCase() + day.slice(1);
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
      key: "bp_name",
      label: "Supplier",
      sortable: true,
      render: (value: string) => {
        return <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">{value || '-'}</span>;
      },
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
      render: (value: string) => {
        return <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">{capitalizeDay(value)}</span>;
      },
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
      key: "updated_at",
      label: "Last Modified",
      sortable: true,
      render: (value: string) => {
        if (!value) return <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">-</span>;
        try {
          const date = new Date(value);
          const formatted = date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          return <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">{formatted}</span>;
        } catch {
          return <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">{value}</span>;
        }
      },
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_value: unknown, row: ArrivalManageData) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleEdit(row.id)}
            className="inline-flex items-center justify-center p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="inline-flex items-center justify-center p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
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
{loading ? (
  <SkeletonArrivalManage />
) : (
  <>
    {/* Data Table with Action Button */}
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
      actionButton={
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddNew}
        >
          <Plus className="w-4 h-4" />
          Add New Arrival
        </Button>
      }
    />
    {error && <div className="text-sm text-red-500">{error}</div>}
  </>
)}
      </div>
      <ConfirmationPopup
        isOpen={!!deleteTarget}
        onClose={() => {
          if (isDeleting) return;
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="Delete Arrival Schedule"
        message={
          deleteTarget
            ? `Hapus jadwal kedatangan untuk supplier ${deleteTarget.bp_name} pada ${deleteTarget.day_name ?? deleteTarget.schedule_date ?? '-'} jam ${deleteTarget.arrival_time}?`
            : ""
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}