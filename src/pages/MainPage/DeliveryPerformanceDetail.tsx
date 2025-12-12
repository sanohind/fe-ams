import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { SkeletonDataTable } from "../../components/ui/skeleton/Skeleton";
import apiService from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { ArrowLeft, TrendingUp, Award, AlertCircle, BarChart3 } from "lucide-react";

interface PerformanceDetail {
  id: number;
  bp_code: string;
  period_month: number;
  period_year: number;
  total_dn_qty: number;
  total_receipt_qty: number;
  fulfillment_percentage: number;
  fulfillment_index: number;
  total_deliveries: number;
  on_time_deliveries: number;
  total_delay_days: number;
  delivery_index: number;
  total_index: number;
  final_score: number;
  performance_grade: string;
  ranking: number;
  category: string;
  calculated_at: string;
}

interface SupplierInfo {
  bp_code: string;
  bp_name: string;
}

const DeliveryPerformanceDetail = () => {
  const { bpCode } = useParams<{ bpCode: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performance, setPerformance] = useState<PerformanceDetail | null>(null);
  const [supplier, setSupplier] = useState<SupplierInfo | null>(null);

  const month = (location.state as any)?.month || new Date().getMonth() + 1;
  const year = (location.state as any)?.year || new Date().getFullYear();

  useEffect(() => {
    const fetchDetail = async () => {
      if (!bpCode) {
        setError("Supplier code not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await apiService.getDeliveryPerformanceDetail(bpCode, {
          month,
          year,
        });

        if (res.success && res.data) {
          const data = res.data as any;
          setPerformance(data.performance as PerformanceDetail);
          setSupplier(data.supplier as SupplierInfo);
        } else {
          setError(res.message || "Failed to fetch performance detail");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        toast.error("Error", { title: "Error" });
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [bpCode, month, year]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "B":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "C":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "D":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "best":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "medium":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "worst":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  if (loading) {
    return (
      <>
        <PageMeta title="Delivery Performance Detail" description="View detailed delivery performance metrics" />
        <PageBreadcrumb pageTitle="Delivery Performance Detail" />
        <SkeletonDataTable />
      </>
    );
  }

  if (error || !performance) {
    return (
      <>
        <PageMeta title="Delivery Performance Detail" description="View detailed delivery performance metrics" />
        <PageBreadcrumb pageTitle="Delivery Performance Detail" />
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
          <div className="flex items-center gap-3 text-red-800 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error || "Performance data not found"}</span>
          </div>
          <button
            onClick={() => navigate("/delivery-performance")}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
          >
            Back to List
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Delivery Performance Detail" description="View detailed delivery performance metrics" />
      <PageBreadcrumb pageTitle="Delivery Performance Detail" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/delivery-performance")}
            className="flex items-center gap-2 px-4 py-2 text-blue-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to List
          </button>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {monthNames[month - 1]} {year}
            </p>
          </div>
        </div>

        {/* Supplier Info */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Supplier Code</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{performance.bp_code}</p>
            </div>
            {supplier && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Supplier Name</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{supplier.bp_name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ranking</p>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <p className="text-xl font-semibold text-gray-900 dark:text-white"># {performance.ranking}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Final Score</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{performance.final_score}</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Grade</p>
            <p className={`text-3xl font-bold px-3 py-1 rounded-lg w-fit ${getGradeColor(performance.performance_grade)}`}>
              {performance.performance_grade}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Category</p>
            <p className={`text-lg font-bold px-3 py-1 rounded-lg w-fit ${getCategoryColor(performance.category)}`}>
              {performance.category.charAt(0).toUpperCase() + performance.category.slice(1)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Index</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{performance.total_index}</p>
          </div>
        </div>

        {/* Fulfillment Parameter */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Order Fulfillment Parameter
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total DN Quantity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.total_dn_qty.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Total quantity ordered</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Receipt Quantity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.total_receipt_qty.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Total quantity scanned & received</p>
            </div>

            <div className="border-l-4 border-amber-500 pl-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Fulfillment Percentage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.fulfillment_percentage.toFixed(2)}%</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${Math.min(performance.fulfillment_percentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Fulfillment Index (Penalty)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.fulfillment_index}</p>
              <p className="text-xs text-gray-500 mt-1">Points deducted from score</p>
            </div>
          </div>
        </div>

        {/* On-Time Delivery Parameter */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
            <TrendingUp className="w-5 h-5 text-green-500" />
            On-Time Delivery Parameter
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.total_deliveries}</p>
              <p className="text-xs text-gray-500 mt-1">Regular arrivals in period</p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">On-Time Deliveries</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.on_time_deliveries}</p>
              <p className="text-xs text-gray-500 mt-1">Arrivals with on_commitment status</p>
            </div>

            <div className="border-l-4 border-amber-500 pl-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">On-Time Percentage</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {performance.total_deliveries > 0
                  ? ((performance.on_time_deliveries / performance.total_deliveries) * 100).toFixed(2)
                  : "0"}
                %
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Delay Days</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.total_delay_days}</p>
              <p className="text-xs text-gray-500 mt-1">Days delayed across all deliveries</p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4 md:col-span-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Delivery Index (Penalty)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.delivery_index}</p>
              <p className="text-xs text-gray-500 mt-1">Points deducted from score</p>
            </div>
          </div>
        </div>

        {/* Score Calculation Summary */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
          <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Score Calculation Summary</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Base Score</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">100</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Fulfillment Index (Penalty)</span>
              <span className="text-xl font-bold text-red-600">- {performance.fulfillment_index}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Delivery Index (Penalty)</span>
              <span className="text-xl font-bold text-red-600">- {performance.delivery_index}</span>
            </div>

            <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-4 flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-lg font-semibold text-gray-800 dark:text-white">Final Score</span>
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{performance.final_score}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeliveryPerformanceDetail;
