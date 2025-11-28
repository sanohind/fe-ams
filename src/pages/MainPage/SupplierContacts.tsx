import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne, { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import { SkeletonDataTable } from "../../components/ui/skeleton/Skeleton";
import apiService from "../../services/api";

interface SupplierContact {
  bp_code: string;
  bp_name: string;
  status: string | null;
  phone: string | null;
  fax: string | null;
  emails: string[];
}

export default function SupplierContacts() {
  const [contacts, setContacts] = useState<SupplierContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getSupplierContacts();
      if (res.success && res.data) {
        setContacts(res.data as SupplierContact[]);
      } else {
        setError(res.message || "Failed to fetch supplier contacts");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to fetch supplier contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statusColor = (status?: string | null) => {
    if (!status) {
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
    }

    const normalized = status.toLowerCase();
    if (normalized.includes("active")) {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
    if (normalized.includes("inactive") || normalized.includes("suspend")) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  };

  const columns: ColumnConfig[] = useMemo(() => [
    {
      key: "bp_code",
      label: "Supplier Code",
      sortable: true,
      render: (value: string) => (
        <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "bp_name",
      label: "Supplier Name",
      sortable: true,
      render: (value: string) => (
        <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value: string | null) => (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusColor(value)}`}>
          {value || "Unknown"}
        </span>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      sortable: true,
      render: (value: string | null) => (
        <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "fax",
      label: "Fax",
      sortable: true,
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
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              row.phone
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                : "cursor-not-allowed text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/20"
            }`}
          >
            Phone
          </a>
          <a
            href={row.emails && row.emails.length > 0 ? `mailto:${row.emails[0]}` : undefined}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              row.emails && row.emails.length > 0
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                : "cursor-not-allowed text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/20"
            }`}
          >
            Email
          </a>
        </div>
      ),
    },
  ], []);

  return (
    <>
      <PageMeta
        title="Supplier Contact | SPHERE by SANOH Indonesia"
        description="Supplier contact list from SCM"
      />
      <PageBreadcrumb pageTitle="Supplier Contacts" />

      <div className="space-y-5 sm:space-y-6">
        {loading ? (
          <SkeletonDataTable rows={5} columns={7} showTitle={true} />
        ) : (
          <>
            {/* Data Table */}
            <DataTableOne
              title="Contact List"
              data={contacts}
              columns={columns}
              defaultItemsPerPage={10}
              itemsPerPageOptions={[5, 10, 15, 20]}
              defaultSortKey="bp_name"
              defaultSortOrder="asc"
              searchable={true}
              searchPlaceholder="Search suppliers, codes, contacts..."
            />
            {error && <div className="text-sm text-red-500">{error}</div>}
          </>
        )}
      </div>
    </>
  );
}