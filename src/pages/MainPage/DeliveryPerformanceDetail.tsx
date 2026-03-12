import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { SkeletonDeliveryPerformanceDetail } from "../../components/ui/skeleton/Skeleton";
import apiService from "../../services/api";
import { useToast } from "../../hooks/useToast";
import { TrendingUp, Award, AlertCircle, BarChart3 } from "lucide-react";

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

        const res = await apiService.getDeliveryPerformanceDetail(bpCode, { month, year });

        if (res.success && res.data) {
          const data = res.data as any;
          const raw = data.performance as any;
          setPerformance({
            ...raw,
            total_dn_qty: Number(raw.total_dn_qty ?? 0),
            total_receipt_qty: Number(raw.total_receipt_qty ?? 0),
            fulfillment_percentage: Number(raw.fulfillment_percentage ?? 0),
            fulfillment_index: Number(raw.fulfillment_index ?? 0),
            total_deliveries: Number(raw.total_deliveries ?? 0),
            on_time_deliveries: Number(raw.on_time_deliveries ?? 0),
            total_delay_days: Number(raw.total_delay_days ?? 0),
            delivery_index: Number(raw.delivery_index ?? 0),
            total_index: Number(raw.total_index ?? 0),
            final_score: Number(raw.final_score ?? 0),
            ranking: Number(raw.ranking ?? 0),
          });
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
      case "A": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "B": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "C": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "D": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "best": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "medium": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "worst": return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const breadcrumbs = [
    { label: "Home", path: "/" },
    { label: "Delivery Performance", path: "/delivery-performance" },
    { label: "Detail" },
  ];

  if (loading) {
    return (
      <>
        <PageMeta title="Delivery Performance Detail" description="View detailed delivery performance metrics" />
        <PageBreadcrumb pageTitle="Delivery Performance Detail" breadcrumbs={breadcrumbs} />
        <SkeletonDeliveryPerformanceDetail />
      </>
    );
  }

  if (error || !performance) {
    return (
      <>
        <PageMeta title="Delivery Performance Detail" description="View detailed delivery performance metrics" />
        <PageBreadcrumb pageTitle="Delivery Performance Detail" breadcrumbs={breadcrumbs} />
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 text-red-800 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error || "Performance data not found"}</span>
          </div>
        </div>
      </>
    );
  }

  const onTimePct =
    performance.total_deliveries > 0
      ? ((performance.on_time_deliveries / performance.total_deliveries) * 100).toFixed(2)
      : "0";

  return (
    <>
      <PageMeta title="Delivery Performance Detail" description="View detailed delivery performance metrics" />
      <PageBreadcrumb pageTitle="Delivery Performance Detail" breadcrumbs={breadcrumbs} />

      <div className="space-y-6">

        {/* ── Supplier Info ─────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {supplier?.bp_name ?? performance.bp_code}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {performance.bp_code} &middot; {monthNames[month - 1]} {year}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Rank #{performance.ranking}
              </span>
            </div>
          </div>
        </div>

        {/* ── Score Overview ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Final Score */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
            <p className="text-xs text-gray-400 mb-1">Final Score</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.final_score}</p>
          </div>
          {/* Grade */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
            <p className="text-xs text-gray-400 mb-2">Grade</p>
            <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full ${getGradeColor(performance.performance_grade)}`}>
              {performance.performance_grade}
            </span>
          </div>
          {/* Category */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
            <p className="text-xs text-gray-400 mb-2">Category</p>
            <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getCategoryColor(performance.category)}`}>
              {performance.category.charAt(0).toUpperCase() + performance.category.slice(1)}
            </span>
          </div>
          {/* Total Index */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-5">
            <p className="text-xs text-gray-400 mb-1">Total Index</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.total_index}</p>
          </div>
        </div>

        {/* ── Parameters ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Order Fulfillment */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Order Fulfillment
            </h3>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-400 text-xs">Parameter</span>
              <span className="text-right text-gray-400 text-xs">Value</span>
            </div>
            {[
              { label: "Total DN Quantity", value: performance.total_dn_qty.toLocaleString() },
              { label: "Total Receipt Quantity", value: performance.total_receipt_qty.toLocaleString() },
              { label: "Fulfillment (%)", value: `${performance.fulfillment_percentage.toFixed(2)}%` },
              { label: "Fulfillment Index (Penalty)", value: performance.fulfillment_index.toString(), red: true },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                <span className="text-sm text-gray-500 dark:text-gray-400">{row.label}</span>
                <span className={`text-sm font-medium ${row.red ? "text-red-500 dark:text-red-400" : "text-gray-700 dark:text-gray-200"}`}>
                  {row.value}
                </span>
              </div>
            ))}
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Fulfillment Rate</span>
                <span>{performance.fulfillment_percentage.toFixed(2)}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(performance.fulfillment_percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* On-Time Delivery */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              On-Time Delivery
            </h3>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-400 text-xs">Parameter</span>
              <span className="text-right text-gray-400 text-xs">Value</span>
            </div>
            {[
              { label: "Total Deliveries", value: performance.total_deliveries.toString() },
              { label: "On-Time Deliveries", value: performance.on_time_deliveries.toString() },
              { label: "On-Time (%)", value: `${onTimePct}%` },
              { label: "Total Delay Days", value: performance.total_delay_days.toString() },
              { label: "Delivery Index (Penalty)", value: performance.delivery_index.toString(), red: true },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                <span className="text-sm text-gray-500 dark:text-gray-400">{row.label}</span>
                <span className={`text-sm font-medium ${row.red ? "text-red-500 dark:text-red-400" : "text-gray-700 dark:text-gray-200"}`}>
                  {row.value}
                </span>
              </div>
            ))}
            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>On-Time Rate</span>
                <span>{onTimePct}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(Number(onTimePct), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Score Calculation Summary ───────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">Score Calculation Summary</h3>
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 text-xs">Component</span>
            <span className="text-right text-gray-400 text-xs">Points</span>
          </div>
          {[
            { label: "Base Score", value: "100", red: false },
            { label: "Fulfillment Index (Penalty)", value: `− ${performance.fulfillment_index}`, red: true },
            { label: "Delivery Index (Penalty)", value: `− ${performance.delivery_index}`, red: true },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
              <span className="text-sm text-gray-500 dark:text-gray-400">{row.label}</span>
              <span className={`text-sm font-semibold ${row.red ? "text-red-500 dark:text-red-400" : "text-gray-700 dark:text-gray-200"}`}>
                {row.value}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-4">
            <span className="text-base font-semibold text-gray-800 dark:text-white/90">Final Score</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{performance.final_score}</span>
          </div>
        </div>

        {/* Calculated at */}
        {performance.calculated_at && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
            Calculated at: {new Date(performance.calculated_at).toLocaleString()}
          </p>
        )}

      </div>
    </>
  );
};

export default DeliveryPerformanceDetail;