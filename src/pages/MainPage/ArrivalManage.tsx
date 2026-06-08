import { useEffect, useMemo, useState, useCallback } from "react";
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
import Badge from "../../components/ui/badge/Badge";

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

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export default function ArrivalManage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState<ArrivalManageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArrivalManageData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
  });

  const loadData = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getArrivalManageList({ page, per_page: 10 });
      if (res.success && res.data) {
        setData(res.data as ArrivalManageData[]);
        if ((res as any).pagination) {
          setPagination((res as any).pagination);
        }
      } else {
        setError(res.message || "Failed to load schedules");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load schedules");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handlePageChange = (page: number) => {
    loadData(page);
  };

  const handleEdit = (id: number) => {
    navigate(`/add-arrival?id=${id}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await apiService.deleteArrivalSchedule(deleteTarget.id);
      // Reload current page after delete
      loadData(pagination.current_page);
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
      label: "No",
      sortable: false,
    },
    {
      key: "bp_code",
      label: "Supplier Code",
      sortable: false,
    },
    {
      key: "bp_name",
      label: "Supplier",
      sortable: false,
      render: (value: string) => {
        return <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">{value || '-'}</span>;
      },
    },
    {
      key: "arrival_time",
      label: "Arrival",
      sortable: false,
    },
    {
      key: "departure_time",
      label: "Departure",
      sortable: false,
      render: (value: string | null) => {
        return <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">{value || '-'}</span>;
      },
    },
    {
      key: "day_name",
      label: "Day",
      sortable: false,
      render: (value: string) => {
        return <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">{capitalizeDay(value)}</span>;
      },
    },
    {
      key: "dock",
      label: "Dock",
      sortable: false,
    },
    {
      key: "arrival_type",
      label: "Type",
      sortable: false,
      render: (value: string) => {
        const colors: Record<string, "success" | "info" | "light"> = {
          regular: "success",
          additional: "info",
        };
        const label = value.charAt(0).toUpperCase() + value.slice(1);
        return <Badge variant="light" color={colors[value] || "light"}>{label}</Badge>;
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
      <PageMeta title="Arrival Management | AMS - Sanoh Indonesia" description="This is React.js Arrival Management page for AMS - Sanoh Indonesia" />
      <PageBreadcrumb pageTitle="Arrival Management" />

      <div className="space-y-5 sm:space-y-6">
        {initialLoading ? (
          <SkeletonArrivalManage />
        ) : (
          <>
            {/* Data Table with server-side pagination */}
            <DataTableOne
              title="Arrival Schedule List"
              data={data}
              columns={columns}
              searchable={false}
              serverSidePagination={true}
              serverCurrentPage={pagination.current_page}
              serverTotalPages={pagination.last_page}
              serverTotalItems={pagination.total}
              serverFrom={pagination.from ?? undefined}
              serverTo={pagination.to ?? undefined}
              onServerPageChange={handlePageChange}
              serverLoading={loading}
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