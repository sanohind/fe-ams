import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne, { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import { SkeletonDataTable, Skeleton } from "../../components/ui/skeleton/Skeleton";
import apiService from "../../services/api";

// Interface untuk data stock
interface StockData {
  warehouse: string;
  partno: string;
  desc: string;
  partname: string;
  oldpartno: string;
  group: string;
  groupkey: string;
  product_type: string;
  model: string;
  customer: string;
  onhand: number;
  allocated: number;
  onorder: number;
  economicstock: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  location: string;
}

// Interface untuk data yang sudah dikalkulasi
interface EnhancedStockData extends StockData {
  available: number;
  status: string;
  statusColor: string;
  reorder_qty: number;
}

// Fungsi untuk menghitung available stock
const calculateAvailable = (onhand: number, allocated: number): number => {
  return onhand - allocated;
};

// Fungsi untuk menentukan status stock
const getStockStatus = (
  onhand: number,
  min_stock: number,
  max_stock: number
): { status: string; color: string } => {
  if (onhand < min_stock) {
    return { status: "Critical", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
  } else if (onhand > max_stock) {
    return { status: "Overstock", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" };
  } else {
    return { status: "Normal", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" };
  }
};

// Fungsi untuk menghitung reorder quantity
const calculateReorderQty = (
  onhand: number,
  min_stock: number,
  max_stock: number
): number => {
  if (onhand < min_stock) {
    return max_stock - onhand;
  }
  return 0;
};

// Data dari ERP
const useLevelStockData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StockData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiService.getStockLevels({ per_page: 100 });
        if (res.success && (res.data as any)?.stocks) {
          const mapped: StockData[] = ((res.data as any).stocks as any[]).map((s: any) => ({
            warehouse: s.warehouse,
            partno: s.part_no ?? s.partno,
            desc: s.description ?? s.desc,
            partname: s.part_name ?? s.partname,
            oldpartno: s.old_part_no ?? s.oldpartno,
            group: s.group,
            groupkey: s.group_key ?? s.groupkey,
            product_type: s.product_type,
            model: s.model,
            customer: s.customer,
            onhand: Number(s.onhand ?? 0),
            allocated: Number(s.allocated ?? 0),
            onorder: Number(s.onorder ?? 0),
            economicstock: Number(s.economic_stock ?? s.economicstock ?? 0),
            min_stock: Number(s.min_stock ?? 0),
            max_stock: Number(s.max_stock ?? 0),
            unit: s.unit,
            location: s.location,
          }));
          setData(mapped);
        } else {
          setError(res.message || 'Failed to load stock data');
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const enhanced: EnhancedStockData[] = useMemo(() => {
    return data.map(item => {
      const available = calculateAvailable(item.onhand, item.allocated);
      const { status, color } = getStockStatus(
        item.onhand,
        item.min_stock,
        item.max_stock
      );
      const reorder_qty = calculateReorderQty(item.onhand, item.min_stock, item.max_stock);
      return { ...item, available, status, statusColor: color, reorder_qty };
    });
  }, [data]);

  return { loading, error, data: enhanced };
};

export default function LevelStock() {
  const { loading, error, data: enhancedStockData } = useLevelStockData();

// Konfigurasi kolom untuk level stock (Opsi 2: Detail View)
const columns: ColumnConfig[] = [
  {
    key: "partno",
    label: "Part No",
    sortable: true,
  },
  {
    key: "desc",
    label: "Description",
    sortable: true,
  },
  {
    key: "unit",
    label: "Unit",
    sortable: true,
  },
  {
    key: "warehouse",
    label: "Warehouse",
    sortable: true,
  },
  {
    key: "location",
    label: "Location",
    sortable: true,
  },
  {
    key: "onhand",
    label: "On Hand",
    sortable: true,
  },
  {
    key: "min_stock",
    label: "Min",
    sortable: true,
  },
  {
    key: "max_stock",
    label: "Max",
    sortable: true,
  },
  {
    key: "status",
    label: "Status",
    sortable: true,
    render: (value: string, row: EnhancedStockData) => (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${row.statusColor}`}>
        {value}
      </span>
    )
  },
];

  // Hitung summary statistics
  const criticalParts = enhancedStockData.filter(item => item.status === "Critical").length;
  const overstockParts = enhancedStockData.filter(item => item.status === "Overstock").length;
  const normalParts = enhancedStockData.filter(item => item.status === "Normal").length;

  return (
    <div className="overflow-x-hidden space-y-5 sm:space-y-6">
      <PageMeta
        title="Level Stock | SPHERE by SANOH Indonesia"
        description="This is React.js Data Tables Dashboard page for SPHERE by SANOH Indonesia"
      />
      <PageBreadcrumb pageTitle="Level Stock" />
      
      {loading ? (
        <>
          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#171A2A] rounded-lg p-4 border-b-[2px] border-gray-300">
                <Skeleton height={16} width="60%" className="mb-3" />
                <Skeleton height={32} width="50%" />
              </div>
            ))}
          </div>
          
          {/* Table Skeleton */}
          <SkeletonDataTable rows={5} columns={10} showTitle={true} />
        </>
      ) : (
        <>
          {error && (
            <div className="text-red-600 dark:text-red-400">{error}</div>
          )}
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#171A2A] rounded-lg p-4 border-b-[2px] border-red-800">
              <div className="text-gray-800 dark:text-white text-sm font-medium">Critical Parts</div>
              <div className="text-3xl font-bold text-gray-800 dark:text-white/80 mt-1">{criticalParts}</div>
            </div>
            
            <div className="bg-white dark:bg-[#171A2A] rounded-lg p-4 border-b-[2px] border-yellow-800">
              <div className="text-gray-800 dark:text-white text-sm font-medium">Overstock Parts</div>
              <div className="text-3xl font-bold text-gray-800 dark:text-white/80 mt-1">{overstockParts}</div>
            </div>
            
            <div className="bg-white dark:bg-[#171A2A] rounded-lg p-4 border-b-[2px] border-green-600">
              <div className="text-gray-800 dark:text-white text-sm font-medium">Normal Parts</div>
              <div className="text-3xl font-bold text-gray-800 dark:text-white/80 mt-1">{normalParts}</div>
            </div>
          </div>

          {/* Data Table */}
          <div className="space-y-5 sm:space-y-6">
            <DataTableOne 
              title="Stock by Warehouse"
              data={enhancedStockData}
              columns={columns}
              defaultItemsPerPage={10}
              itemsPerPageOptions={[5, 10, 15, 20, 50]}
              defaultSortKey="partno"
              defaultSortOrder="asc"
              searchable={true}
              searchPlaceholder="Search part number, description, customer..."
            />
          </div>
        </>
      )}
    </div>
  );
}