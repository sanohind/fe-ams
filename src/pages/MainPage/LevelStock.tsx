import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne, { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";

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
  safety_stock: number;
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
  safety_stock: number,
  max_stock: number
): { status: string; color: string } => {
  if (onhand < min_stock) {
    return { status: "Critical", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
  } else if (onhand < safety_stock) {
    return { status: "Low", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" };
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

// Data untuk level stock (sample data)
const levelStockData: StockData[] = [
  {
    warehouse: "WH-01",
    partno: "P-001-2024",
    desc: "Brake Pad Assembly",
    partname: "Front Brake Pad",
    oldpartno: "P-001-2023",
    group: "Brake System",
    groupkey: "BRK",
    product_type: "Automotive Parts",
    model: "Model A",
    customer: "Toyota",
    onhand: 1500,
    allocated: 300,
    onorder: 500,
    economicstock: 1200,
    safety_stock: 200,
    min_stock: 800,
    max_stock: 2000,
    unit: "PCS",
    location: "A-01-01"
  },
  {
    warehouse: "WH-01",
    partno: "P-002-2024",
    desc: "Oil Filter",
    partname: "Engine Oil Filter",
    oldpartno: "P-002-2023",
    group: "Engine Parts",
    groupkey: "ENG",
    product_type: "Automotive Parts",
    model: "Model B",
    customer: "Honda",
    onhand: 2500,
    allocated: 500,
    onorder: 1000,
    economicstock: 2000,
    safety_stock: 300,
    min_stock: 1500,
    max_stock: 3000,
    unit: "PCS",
    location: "A-02-03"
  },
  {
    warehouse: "WH-02",
    partno: "P-003-2024",
    desc: "Air Filter",
    partname: "Cabin Air Filter",
    oldpartno: "P-003-2023",
    group: "Engine Parts",
    groupkey: "ENG",
    product_type: "Automotive Parts",
    model: "Model C",
    customer: "Nissan",
    onhand: 500,
    allocated: 150,
    onorder: 300,
    economicstock: 1000,
    safety_stock: 650,
    min_stock: 600,
    max_stock: 1500,
    unit: "PCS",
    location: "B-01-05"
  },
  {
    warehouse: "WH-02",
    partno: "P-004-2024",
    desc: "Spark Plug",
    partname: "Iridium Spark Plug",
    oldpartno: "P-004-2023",
    group: "Engine Parts",
    groupkey: "ENG",
    product_type: "Automotive Parts",
    model: "Model D",
    customer: "Mitsubishi",
    onhand: 3000,
    allocated: 600,
    onorder: 1500,
    economicstock: 2500,
    safety_stock: 400,
    min_stock: 2000,
    max_stock: 4000,
    unit: "PCS",
    location: "B-03-02"
  },
  {
    warehouse: "WH-01",
    partno: "P-005-2024",
    desc: "Wiper Blade",
    partname: "Front Wiper Blade",
    oldpartno: "P-005-2023",
    group: "Accessories",
    groupkey: "ACC",
    product_type: "Automotive Parts",
    model: "Model E",
    customer: "Suzuki",
    onhand: 1200,
    allocated: 200,
    onorder: 400,
    economicstock: 1000,
    safety_stock: 150,
    min_stock: 700,
    max_stock: 1800,
    unit: "PCS",
    location: "A-05-04"
  },
  {
    warehouse: "WH-01",
    partno: "P-006-2024",
    desc: "Battery 12V",
    partname: "Car Battery",
    oldpartno: "P-006-2023",
    group: "Electrical",
    groupkey: "ELE",
    product_type: "Automotive Parts",
    model: "Model F",
    customer: "Daihatsu",
    onhand: 250,
    allocated: 100,
    onorder: 200,
    economicstock: 500,
    safety_stock: 400,
    min_stock: 300,
    max_stock: 800,
    unit: "PCS",
    location: "A-03-02"
  },
  {
    warehouse: "WH-02",
    partno: "P-007-2024",
    desc: "Radiator Coolant",
    partname: "Engine Coolant 5L",
    oldpartno: "P-007-2023",
    group: "Engine Parts",
    groupkey: "ENG",
    product_type: "Automotive Parts",
    model: "Model G",
    customer: "Toyota",
    onhand: 4500,
    allocated: 300,
    onorder: 500,
    economicstock: 2000,
    safety_stock: 500,
    min_stock: 1500,
    max_stock: 3500,
    unit: "BTL",
    location: "B-05-01"
  }
];

// Enhance data dengan kalkulasi
const enhancedStockData: EnhancedStockData[] = levelStockData.map(item => {
  const available = calculateAvailable(item.onhand, item.allocated);
  const { status, color } = getStockStatus(
    item.onhand,
    item.min_stock,
    item.safety_stock,
    item.max_stock
  );
  const reorder_qty = calculateReorderQty(item.onhand, item.min_stock, item.max_stock);

  return {
    ...item,
    available,
    status,
    statusColor: color,
    reorder_qty
  };
});

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
    key: "allocated",
    label: "Allocated",
    sortable: true,
  },
  {
    key: "available",
    label: "Available",
    sortable: true,
    render: (value: number) => (
      <span className="font-bold text-blue-600">{value.toLocaleString()}</span>
    )
  },
  {
    key: "onorder",
    label: "On Order",
    sortable: true,
  },
  {
    key: "min_stock",
    label: "Min",
    sortable: true,
  },
  {
    key: "safety_stock",
    label: "Safety",
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
  {
    key: "reorder_qty",
    label: "Reorder Qty",
    sortable: true,
    render: (value: number) => (
      value > 0 ? (
        <span className="font-semibold text-red-600">{value.toLocaleString()}</span>
      ) : (
        <span className="text-gray-400">-</span>
      )
    )
  }
];

export default function LevelStock() {
  // Hitung summary statistics
  const totalParts = enhancedStockData.length;
  const criticalParts = enhancedStockData.filter(item => item.status === "Critical").length;
  const lowParts = enhancedStockData.filter(item => item.status === "Low").length;
  const overstockParts = enhancedStockData.filter(item => item.status === "Overstock").length;
  const normalParts = enhancedStockData.filter(item => item.status === "Normal").length;

  return (
    <div className="overflow-x-hidden space-y-5 sm:space-y-6">
      <PageMeta
        title="Level Stock | SPHERE by SANOH Indonesia"
        description="This is React.js Data Tables Dashboard page for SPHERE by SANOH Indonesia"
      />
      <PageBreadcrumb pageTitle="Level Stock" />
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#171A2A] rounded-lg p-4 border border-red-800">
          <div className="text-white text-sm font-medium">Critical Parts</div>
          <div className="text-3xl font-bold text-white/80 mt-1">{criticalParts}</div>
          <div className="text-xs text-white/80 mt-1">Below Min Stock</div>
        </div>
        
        <div className="bg-[#171A2A] rounded-lg p-4 border border-yellow-800">
          <div className="text-white text-sm font-medium">Low Stock Parts</div>
          <div className="text-3xl font-bold text-white/80 mt-1">{lowParts}</div>
          <div className="text-xs text-white/80 mt-1">Below Safety Stock</div>
        </div>
        
        <div className="bg-[#171A2A] rounded-lg p-4 border border-orange-800">
          <div className="text-white text-sm font-medium">Overstock Parts</div>
          <div className="text-3xl font-bold text-white/80 mt-1">{overstockParts}</div>
          <div className="text-xs text-white/80 mt-1">Above Max Stock</div>
        </div>
        
        <div className="bg-[#171A2A] rounded-lg p-4 border border-green-800">
          <div className="text-white text-sm font-medium">Normal Parts</div>
          <div className="text-3xl font-bold text-white/80 mt-1">{normalParts}</div>
          <div className="text-xs text-white/80 mt-1">Optimal Stock Level</div>
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
    </div>
  );
}