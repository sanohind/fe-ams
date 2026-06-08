import { useEffect, useState, useCallback, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { SkeletonSupplierContacts } from "../../components/ui/skeleton/Skeleton";
import Checkbox from "../../components/form/input/Checkbox";
import apiService from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../context/AuthContext";
import { Check, PackageCheck, Printer, X, ArrowUp, ArrowDown } from "lucide-react";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import PaginationWithIcon from "../../components/tables/DataTables/TableOne/PaginationWithIcon";
import Badge from "../../components/ui/badge/Badge";

interface PoReceiptItem {
  id: number;
  bp_id: string;
  bp_name: string;
  status: string | null;
  po_no: string;
  po_line: number;
  item: string;
  desc: string;
  item_type: string | null;
  item_group: string | null;
  code_item_type: string | null;
  order_qty: number;
  unit: string;
  po_date2: string | null;
  po_date: string | null;
  plan_delv_date: string | null;
  price: number;
  order_amount: number;
  receipt_qty: number | null;
  receipt_amount: number | null;
  receipt_date: string | null;
  receipt_date_local: string | null;
  purch_type: string | null;
  pr_no: string | null;
  pr_ref: string | null;
  buyer_code: string | null;
  buyer: string | null;
  pickup_date: string | null;
  pickup_pic: string | null;
  pickup_dept: string | null;
  receipt_age: number | null;
}

interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface SummaryData {
  green: number;
  yellow: number;
  red: number;
  max_age: number;
}

interface FilterState {
  bp_name: string;
  buyer: string;
  po_no: string;
  po_line: string;
  desc: string;
  order_qty: string;
  receipt_qty: string;
  pickup_pic: string;
}

// ─── Pickup Modal ─────────────────────────────────────────────────────────────
interface PickupModalProps {
  isOpen: boolean;
  itemCount: number;
  onClose: () => void;
  onConfirm: (name: string, dept: string) => void;
  loading: boolean;
}

function PickupModal({ isOpen, itemCount, onClose, onConfirm, loading }: PickupModalProps) {
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [errors, setErrors] = useState<{ name?: string; dept?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDept("");
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, loading, onClose]);

  const validate = () => {
    const errs: { name?: string; dept?: string } = {};
    if (!name.trim()) errs.name = "Pickup name is required";
    if (!dept.trim()) errs.dept = "Department is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onConfirm(name.trim(), dept.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={() => !loading && onClose()}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-brand-500/10 dark:bg-brand-500/20">
                <PackageCheck className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  Confirm Pickup
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {itemCount} item{itemCount > 1 ? "s" : ""} will be marked as picked up
                </p>
              </div>
            </div>
            <button
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <div>
              <Label>
                Pickup Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                }}
                placeholder="Enter pickup name"
                disabled={loading}
                error={!!errors.name}
                hint={errors.name}
              />
            </div>

            <div>
              <Label>
                Department <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={dept}
                onChange={(e) => {
                  setDept(e.target.value);
                  if (errors.dept) setErrors((p) => ({ ...p, dept: undefined }));
                }}
                placeholder="e.g. Purchasing, Warehouse, Production"
                disabled={loading}
                error={!!errors.dept}
                hint={errors.dept}
              />
            </div>
          </form>

          <div className="flex justify-end gap-3 px-5 pb-5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => !loading && onClose()}
              disabled={loading}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (validate()) onConfirm(name.trim(), dept.trim());
              }}
              disabled={loading}
              className="px-4 py-2 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Pickup
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PoReceiptMonitor() {
  const toast = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState<PoReceiptItem[]>([]);
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

  const [summary, setSummary] = useState<SummaryData>({
    green: 0,
    yellow: 0,
    red: 0,
    max_age: 0,
  });

  const [pickupFilter, setPickupFilter] = useState<'all' | 'pending' | 'picked_up'>('all');

  // Sorting
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Column Filters
  const [columnFilters, setColumnFilters] = useState<FilterState>({
    bp_name: "",
    buyer: "",
    po_no: "",
    po_line: "",
    desc: "",
    order_qty: "",
    receipt_qty: "",
    pickup_pic: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState<FilterState>(columnFilters);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Pickup modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Debounce filters
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(columnFilters);
    }, 400);
    return () => clearTimeout(handler);
  }, [columnFilters]);

  // Reset to first page when filtering or sorting changes
  useEffect(() => {
    setPagination(prev => {
      if (prev.current_page === 1) return prev;
      return { ...prev, current_page: 1 };
    });
  }, [debouncedFilters, pickupFilter, sortBy, sortDir]);

  const requestCounter = useRef(0);

  const loadData = useCallback(async (
    page: number,
    search: string,
    filter: 'all' | 'pending' | 'picked_up',
    colFilters: FilterState,
    sBy: string,
    sDir: "asc" | "desc",
    perPage: number
  ) => {
    const currentRequest = ++requestCounter.current;
    setLoading(true);
    setError(null);
    setSelectedIds(new Set()); // reset selection on load
    try {
      const res = await apiService.getPoReceipts({
        page,
        per_page: perPage,
        search: search || undefined,
        pickup_status: filter !== 'all' ? filter : undefined,
        bp_name: colFilters.bp_name || undefined,
        buyer: colFilters.buyer || undefined,
        po_no: colFilters.po_no || undefined,
        po_line: colFilters.po_line || undefined,
        desc: colFilters.desc || undefined,
        order_qty: colFilters.order_qty || undefined,
        receipt_qty: colFilters.receipt_qty || undefined,
        pickup_pic: colFilters.pickup_pic || undefined,
        sort_by: sBy,
        sort_dir: sDir,
      });

      if (currentRequest !== requestCounter.current) return;

      if (res.success && res.data) {
        setItems(res.data as PoReceiptItem[]);
        if ((res as any).pagination) {
          setPagination((res as any).pagination);
        }
        if ((res as any).summary) {
          setSummary((res as any).summary);
        }
      } else {
        setError(res.message || "Failed to fetch PO receipts");
      }
    } catch (e: any) {
      if (currentRequest !== requestCounter.current) return;
      setError(e?.message || "Failed to fetch PO receipts");
    } finally {
      if (currentRequest === requestCounter.current) {
        setLoading(false);
        setInitialLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData(
      pagination.current_page,
      "",
      pickupFilter,
      debouncedFilters,
      sortBy,
      sortDir,
      pagination.per_page
    );
  }, [
    loadData,
    pagination.current_page,
    pagination.per_page,
    pickupFilter,
    debouncedFilters,
    sortBy,
    sortDir
  ]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPickupFilter(e.target.value as 'all' | 'pending' | 'picked_up');
  };

  const handleColumnFilterChange = (column: keyof FilterState, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPagination(prev => ({ ...prev, current_page: 1, per_page: parseInt(e.target.value, 10) }));
  };

  // ── Checkbox helpers ────────────────────────────────────────────────────────
  const isAllSelected = items.length > 0 && items.every((r) => selectedIds.has(r.id));
  const isIndeterminate = !isAllSelected && items.some((r) => selectedIds.has(r.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(items.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Pickup flow ─────────────────────────────────────────────────────────────
  const openPickupModal = () => {
    if (selectedIds.size === 0) {
      toast.warning("Please select at least 1 item first.", { title: "Notice" });
      return;
    }
    const alreadyPickedUp = items.filter((r) => selectedIds.has(r.id) && !!r.pickup_date);
    if (alreadyPickedUp.length > 0) {
      toast.warning(
        `${alreadyPickedUp.length} selected item(s) have already been picked up. Please deselect them before proceeding.`,
        { title: "Notice" }
      );
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmPickup = async (pickupName: string, pickupDept: string) => {
    setModalLoading(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await apiService.pickPoReceiptBulk({
        ids,
        pickup_name: pickupName,
        pickup_dept: pickupDept,
      });

      if (res.success) {
        toast.success(`${(res as any).count ?? ids.length} item(s) successfully marked as picked up.`, { title: "Success" });
        setIsModalOpen(false);
        setSelectedIds(new Set());
        loadData(pagination.current_page, "", pickupFilter, debouncedFilters, sortBy, sortDir, pagination.per_page);
      } else {
        toast.error(res.message || "Failed to record pickup.", { title: "Failed" });
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to record pickup.", { title: "Error" });
    } finally {
      setModalLoading(false);
    }
  };

  // ── Print Label flow ────────────────────────────────────────────────────────────
  const openPrintLabel = async () => {
    if (selectedIds.size === 0) {
      toast.warning("Please select at least 1 item first.", { title: "Notice" });
      return;
    }

    const ids = Array.from(selectedIds);

    try {
      const res = await apiService.printPoReceipt(ids);

      if (!res.success || !res.data) {
        toast.error(res.message || "Failed to prepare label data.", { title: "Error" });
        return;
      }

      const labelData = encodeURIComponent(JSON.stringify(res.data));
      const receivedBy = encodeURIComponent(user?.name ?? "Unknown");
      window.open(`/#/po-receipt-print-label?data=${labelData}&received_by=${receivedBy}`, "_blank");

      loadData(pagination.current_page, "", pickupFilter, debouncedFilters, sortBy, sortDir, pagination.per_page);
    } catch (e: any) {
      toast.error(e?.message || "Failed to prepare label data.", { title: "Error" });
    }
  };

  const ageColor = (age: number | null) => {
    if (age === null) return "text-gray-500 dark:text-gray-400";
    const rounded = Math.round(age);
    if (rounded > 5) return "text-red-600 dark:text-red-400 font-semibold";
    if (rounded > 3) return "text-amber-600 dark:text-amber-400 font-medium";
    return "text-green-600 dark:text-green-400";
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return (
      date.toLocaleDateString("id-ID") +
      " " +
      date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return (
        <div className="flex flex-col gap-0.5 ml-1 text-gray-300 dark:text-gray-600">
          <ArrowUp className="w-2.5 h-2.5" />
          <ArrowDown className="w-2.5 h-2.5" />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-0.5 ml-1 text-brand-500">
        {sortDir === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
      </div>
    );
  };

  return (
    <>
      <PageMeta
        title="PO Receipt Monitor | AMS - Sanoh Indonesia"
        description="PO Receipt monitor page showing receipts and pickup history"
      />
      <PageBreadcrumb pageTitle="PO Receipt Monitor" />

      <div className="space-y-5 sm:space-y-6">
        {initialLoading ? (
          <SkeletonSupplierContacts />
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#171A2A] rounded-lg p-4 border-b-[2px] border-green-600">
                <div className="text-gray-800 dark:text-white text-sm font-medium">Receipt Age &le; 3 Days</div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white/80 mt-1">{summary.green}</div>
              </div>
              
              <div className="bg-white dark:bg-[#171A2A] rounded-lg p-4 border-b-[2px] border-amber-500">
                <div className="text-gray-800 dark:text-white text-sm font-medium">Receipt Age 4-5 Days</div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white/80 mt-1">{summary.yellow}</div>
              </div>
              
              <div className="bg-white dark:bg-[#171A2A] rounded-lg p-4 border-b-[2px] border-red-600">
                <div className="text-gray-800 dark:text-white text-sm font-medium">Receipt Age &gt; 5 Days</div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white/80 mt-1">{summary.red}</div>
              </div>

              <div className="bg-white dark:bg-[#171A2A] rounded-lg p-4 border-b-[2px] border-gray-600">
                <div className="text-gray-800 dark:text-white text-sm font-medium">Longest Receipt Age</div>
                <div className="text-3xl font-bold text-gray-800 dark:text-white/80 mt-1">{summary.max_age} <span className="text-sm font-normal">days</span></div>
              </div>
            </div>

            <div className="overflow-hidden bg-white rounded-xl dark:bg-white/[0.03]">
              <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 dark:text-gray-400"> Show </span>
                  <div className="relative z-20 bg-transparent">
                    <select
                      className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                      value={pagination.per_page}
                      onChange={handleRowsPerPageChange}
                    >
                      <option value="10" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">10</option>
                      <option value="20" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">20</option>
                      <option value="30" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">30</option>
                      <option value="50" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">50</option>
                    </select>
                    <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
                      <svg className="stroke-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400"> entries </span>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative">
                    <select
                      value={pickupFilter}
                      onChange={handleFilterChange}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-4 pr-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 xl:w-[200px]"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="picked_up">Picked Up</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openPickupModal}
                      disabled={selectedIds.size === 0}
                    >
                      Pickup{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                      <PackageCheck className={`w-5 h-5 ml-1 ${selectedIds.size > 0 ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-600"}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openPrintLabel}
                      disabled={selectedIds.size === 0}
                    >
                      Print Label{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                      <Printer className={`w-5 h-5 ml-1 ${selectedIds.size > 0 ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-600"}`} />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="max-w-full overflow-x-auto custom-scrollbar relative">
                {error ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-red-500">Error: {error}</div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <Checkbox
                            checked={isAllSelected}
                            onChange={(checked) => handleSelectAll(checked)}
                            // @ts-ignore
                            indeterminate={isIndeterminate}
                          />
                        </TableCell>
                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400 mb-2">No</p>
                        </TableCell>
                        
                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400 mb-2">Supplier</p>
                          <input
                            type="text"
                            value={columnFilters.bp_name}
                            onChange={(e) => handleColumnFilterChange('bp_name', e.target.value)}
                            placeholder="Filter..."
                            className="w-full min-w-[120px] px-2 py-1 text-xs border border-gray-300 rounded focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                          />
                        </TableCell>

                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400 mb-2">Buyer</p>
                          <input
                            type="text"
                            value={columnFilters.buyer}
                            onChange={(e) => handleColumnFilterChange('buyer', e.target.value)}
                            placeholder="Filter..."
                            className="w-full min-w-[80px] px-2 py-1 text-xs border border-gray-300 rounded focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                          />
                        </TableCell>

                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400 mb-2">PO No.</p>
                          <input
                            type="text"
                            value={columnFilters.po_no}
                            onChange={(e) => handleColumnFilterChange('po_no', e.target.value)}
                            placeholder="Filter..."
                            className="w-full min-w-[100px] px-2 py-1 text-xs border border-gray-300 rounded focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                          />
                        </TableCell>

                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400 mb-2">Line</p>
                          <input
                            type="text"
                            value={columnFilters.po_line}
                            onChange={(e) => handleColumnFilterChange('po_line', e.target.value)}
                            placeholder="Filter..."
                            className="w-full min-w-[60px] px-2 py-1 text-xs border border-gray-300 rounded focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                          />
                        </TableCell>

                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400 mb-2">Description</p>
                          <input
                            type="text"
                            value={columnFilters.desc}
                            onChange={(e) => handleColumnFilterChange('desc', e.target.value)}
                            placeholder="Filter..."
                            className="w-full min-w-[150px] px-2 py-1 text-xs border border-gray-300 rounded focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                          />
                        </TableCell>

                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400 mb-2">PO Qty</p>
                          <input
                            type="text"
                            value={columnFilters.order_qty}
                            onChange={(e) => handleColumnFilterChange('order_qty', e.target.value)}
                            placeholder="Filter..."
                            className="w-full min-w-[80px] px-2 py-1 text-xs border border-gray-300 rounded focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                          />
                        </TableCell>

                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <div 
                            className="flex items-center cursor-pointer mb-2"
                            onClick={() => handleSort('plan_delv_date')}
                          >
                            <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Plan Delivery Date</p>
                            {renderSortIcon('plan_delv_date')}
                          </div>
                        </TableCell>

                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400 mb-2">Receipt Qty</p>
                          <input
                            type="text"
                            value={columnFilters.receipt_qty}
                            onChange={(e) => handleColumnFilterChange('receipt_qty', e.target.value)}
                            placeholder="Filter..."
                            className="w-full min-w-[80px] px-2 py-1 text-xs border border-gray-300 rounded focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                          />
                        </TableCell>

                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <div 
                            className="flex items-center cursor-pointer mb-2"
                            onClick={() => handleSort('receipt_date')}
                          >
                            <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Receipt Date (ERP)</p>
                            {renderSortIcon('receipt_date')}
                          </div>
                        </TableCell>

                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <div 
                            className="flex items-center cursor-pointer mb-2"
                            onClick={() => handleSort('receipt_date_local')}
                          >
                            <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Receipt Date (AMS)</p>
                            {renderSortIcon('receipt_date_local')}
                          </div>
                        </TableCell>

                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400 mb-2">Receipt Age (Days)</p>
                        </TableCell>

                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400 mb-2 text-center">Status</p>
                        </TableCell>

                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <div 
                            className="flex items-center cursor-pointer mb-2"
                            onClick={() => handleSort('pickup_date')}
                          >
                            <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Pickup Date</p>
                            {renderSortIcon('pickup_date')}
                          </div>
                        </TableCell>

                        <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                          <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400 mb-2">Pickup PIC</p>
                          <input
                            type="text"
                            value={columnFilters.pickup_pic}
                            onChange={(e) => handleColumnFilterChange('pickup_pic', e.target.value)}
                            placeholder="Filter..."
                            className="w-full min-w-[100px] px-2 py-1 text-xs border border-gray-300 rounded focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                          />
                        </TableCell>

                      </TableRow>
                    </TableHeader>

                    <TableBody className={loading ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
                      {loading && items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={16} className="text-center py-20 text-gray-500 dark:text-gray-400">
                            Loading data...
                          </TableCell>
                        </TableRow>
                      ) : items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={16} className="text-center py-20 text-gray-500 dark:text-gray-400">
                            No PO Receipt records matching your filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((row, rowIndex) => (
                          <TableRow key={row.id}>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedIds.has(row.id)}
                                  onChange={() => toggleSelectOne(row.id)}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm whitespace-nowrap">
                                {(pagination.from ?? 1) + rowIndex}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm max-w-[200px] block truncate" title={row.bp_name}>
                                {row.bp_name || "-"}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm max-w-[100px] block truncate" title={row.buyer || ""}>
                                {row.buyer || "-"}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              <span className="font-medium dark:text-gray-300 text-gray-900 text-theme-sm whitespace-nowrap">
                                {row.po_no || "-"}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm whitespace-nowrap">
                                {row.po_line !== undefined ? row.po_line : "-"}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm max-w-[180px] block truncate" title={row.desc}>
                                {row.desc || "-"}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm whitespace-nowrap">
                                {row.order_qty ? Number(row.order_qty).toLocaleString("id-ID") : "0"} {row.unit}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm whitespace-nowrap">
                                {formatDateTime(row.plan_delv_date)}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm whitespace-nowrap">
                                {row.receipt_qty !== null ? Number(row.receipt_qty).toLocaleString("id-ID") : "-"} {row.unit}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm whitespace-nowrap">
                                {formatDateTime(row.receipt_date)}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm whitespace-nowrap">
                                {formatDateTime(row.receipt_date_local)}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              <span className={`font-normal text-theme-sm whitespace-nowrap ${ageColor(row.receipt_age)}`}>
                                {row.receipt_age !== null ? `${row.receipt_age} days` : "-"}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] text-center">
                              {row.pickup_date ? (
                                <Badge variant="light" color="primary">
                                  Picked Up
                                </Badge>
                              ) : (
                                <Badge variant="light" color="warning">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm whitespace-nowrap">
                                {formatDateTime(row.pickup_date)}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                              {row.pickup_pic ? (
                                <div>
                                  <span className="font-medium dark:text-gray-300 text-gray-800 text-theme-sm block truncate max-w-[120px]">
                                    {row.pickup_pic}
                                  </span>
                                  {row.pickup_dept && (
                                    <span className="text-xs text-gray-500 dark:text-gray-500 block truncate max-w-[120px]">
                                      {row.pickup_dept}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                  <div className="pb-3 xl:pb-0">
                    <p className="pb-3 text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
                      Showing {pagination.from ?? 0} to {pagination.to ?? 0} of {pagination.total} entries
                    </p>
                  </div>
                  <PaginationWithIcon
                    currentPage={pagination.current_page}
                    totalPages={pagination.last_page}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, current_page: page }))}
                  />
                </div>
              </div>

            </div>
          </>
        )}
      </div>

      <PickupModal
        isOpen={isModalOpen}
        itemCount={selectedIds.size}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmPickup}
        loading={modalLoading}
      />
    </>
  );
}
