import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne, { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import { SkeletonSupplierContacts } from "../../components/ui/skeleton/Skeleton";
import apiService from "../../services/api";
import Badge from "../../components/ui/badge/Badge";

interface SupplierContact {
  bp_code: string;
  bp_name: string;
  status: string | null;
  phone: string | null;
  fax: string | null;
  emails: string[];
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export default function SupplierContacts() {
  const [contacts, setContacts] = useState<SupplierContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: null,
    to: null,
  });

  // Search debounce
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getSupplierContacts({
        page,
        per_page: 10,
        search: search || undefined,
      });
      if (res.success && res.data) {
        setContacts(res.data as SupplierContact[]);
        if ((res as any).pagination) {
          setPagination((res as any).pagination);
        }
      } else {
        setError(res.message || "Failed to fetch supplier contacts");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to fetch supplier contacts");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(1, "");
  }, [loadData]);

  const handlePageChange = (page: number) => {
    loadData(page, searchQuery);
  };

  const handleSearch = (search: string) => {
    setSearchQuery(search);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      loadData(1, search);
    }, 400);
  };

  const statusColor = (status?: string | null): "success" | "error" | "primary" | "light" => {
    if (!status) {
      return "light";
    }

    const normalized = status.toLowerCase();
    if (normalized.includes("active")) {
      return "success";
    }
    if (normalized.includes("inactive") || normalized.includes("suspend")) {
      return "error";
    }
    return "primary";
  };

  const columns: ColumnConfig[] = useMemo(() => [
    {
      key: "no",
      label: "No",
      sortable: false,
      render: (_value: any, _row: SupplierContact, rowIndex?: number) => (
        <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">
          {rowIndex !== undefined
            ? (pagination.from ?? 1) + rowIndex
            : "-"}
        </span>
      ),
    },
    {
      key: "bp_code",
      label: "Supplier Code",
      sortable: false,
      render: (value: string) => (
        <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "bp_name",
      label: "Supplier Name",
      sortable: false,
      render: (value: string) => (
        <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: (value: string | null) => (
        <Badge variant="light" color={statusColor(value) as any}>
          {value || "Unknown"}
        </Badge>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      sortable: false,
      render: (value: string | null) => (
        <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "fax",
      label: "Fax",
      sortable: false,
      render: (value: string | null) => (
        <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "emails",
      label: "Email",
      sortable: false,
      render: (_value: any, row: SupplierContact) => {
        if (!row.emails || row.emails.length === 0) {
          return (
            <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">
              No email listed
            </span>
          );
        }
        const firstEmail = row.emails[0];
        const extraCount = row.emails.length - 1;
        return (
          <div className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">
            <div>{firstEmail}</div>
            {extraCount > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                +{extraCount} more
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_value: any, row: SupplierContact) => (
        <div className="flex items-center gap-2">
          <a
            href={row.phone ? `tel:${row.phone}` : undefined}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${row.phone
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                : "cursor-not-allowed text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/20"
              }`}
          >
            Phone
          </a>
          <a
            href={row.emails && row.emails.length > 0 ? `mailto:${row.emails[0]}` : undefined}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${row.emails && row.emails.length > 0
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                : "cursor-not-allowed text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/20"
              }`}
          >
            Email
          </a>
        </div>
      ),
    },
  ], [pagination.from]);

  return (
    <>
      <PageMeta
        title="Supplier Contact | AMS - Sanoh Indonesia"
        description="Supplier contact list from SCM"
      />
      <PageBreadcrumb pageTitle="Supplier Contacts" />

      <div className="space-y-5 sm:space-y-6">
        {initialLoading ? (
          <SkeletonSupplierContacts />
        ) : (
          <>
            {/* Data Table — server-side pagination */}
            <DataTableOne
              title="Contact List"
              data={contacts}
              columns={columns}
              searchable={true}
              searchPlaceholder="Search suppliers, codes, contacts..."
              serverSidePagination={true}
              serverCurrentPage={pagination.current_page}
              serverTotalPages={pagination.last_page}
              serverTotalItems={pagination.total}
              serverFrom={pagination.from ?? undefined}
              serverTo={pagination.to ?? undefined}
              onServerPageChange={handlePageChange}
              onServerSearch={handleSearch}
              serverLoading={loading}
            />
            {error && <div className="text-sm text-red-500">{error}</div>}
          </>
        )}
      </div>
    </>
  );
}