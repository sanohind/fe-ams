import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne, { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import { SkeletonDeliveryPerformance } from "../../components/ui/skeleton/Skeleton";
import apiService from "../../services/api";
import { useToast } from "../../hooks/useToast";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";

interface PerformanceData {
  id: number;
  bp_code: string;
  bp_name?: string;
  period_month: number;
  period_year: number;
  final_score: number;
  performance_grade: string;
  ranking: number;
  cumulative_final_score?: number;
  cumulative_performance_grade?: string;
  cumulative_ranking?: number;
}

interface TopPerformer {
  bp_code: string;
  bp_name?: string;
  final_score: number;
  performance_grade: string;
  ranking: number;
}

interface LevelDistribution {
  A: number;
  B: number;
  C: number;
  D: number;
}

const DeliveryPerformance = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performances, setPerformances] = useState<PerformanceData[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    return prevMonth;
  });
  const [year, setYear] = useState(() => {
    const now = new Date();
    return now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  });

  const [bestPerformers, setBestPerformers] = useState<TopPerformer[]>([]);
  const [bestCumulativePerformers, setBestCumulativePerformers] = useState<TopPerformer[]>([]);
  const [worstPerformers, setWorstPerformers] = useState<TopPerformer[]>([]);
  const [worstCumulativePerformers, setWorstCumulativePerformers] = useState<TopPerformer[]>([]);
  const [levelDistribution, setLevelDistribution] = useState<LevelDistribution>({ A: 0, B: 0, C: 0, D: 0 });
  const [cumulativeLevelDistribution, setCumulativeLevelDistribution] = useState<LevelDistribution>({ A: 0, B: 0, C: 0, D: 0 });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await apiService.getDeliveryPerformance({
        month,
        year,
      });

      if (res.success && res.data) {
        const data = (res.data as PerformanceData[]) || [];
        setPerformances(data);

        // Calculate distributions
        const monthlyLevels: LevelDistribution = { A: 0, B: 0, C: 0, D: 0 };
        const cumulativeLevels: LevelDistribution = { A: 0, B: 0, C: 0, D: 0 };

        data.forEach((item) => {
          const grade = item.performance_grade as keyof LevelDistribution;
          if (grade in monthlyLevels) {
            monthlyLevels[grade]++;
          }

          const cumulativeGrade = (item.cumulative_performance_grade || item.performance_grade) as keyof LevelDistribution;
          if (cumulativeGrade in cumulativeLevels) {
            cumulativeLevels[cumulativeGrade]++;
          }
        });

        setLevelDistribution(monthlyLevels);
        setCumulativeLevelDistribution(cumulativeLevels);

        // Get top and worst performers
        const sortedByMonth = [...data].sort((a, b) => b.final_score - a.final_score);
        const sortedByCumulative = [...data].sort((a, b) => (b.cumulative_final_score || 0) - (a.cumulative_final_score || 0));

        setBestPerformers(sortedByMonth.slice(0, 3));
        setBestCumulativePerformers(sortedByCumulative.slice(0, 3));
        setWorstPerformers(sortedByMonth.slice(-3).reverse());
        setWorstCumulativePerformers(sortedByCumulative.slice(-3).reverse());
      } else {
        setError(res.message || "Failed to fetch performance data");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error("Error", { title: "Error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const handleDownloadCSV = () => {
    if (performances.length === 0) {
      toast.warning("No data available to download", {
        title: "No Data",
      });
      return;
    }

    try {
      setDownloading(true);

      // CSV Headers
      const headers = [
        "Supplier Code",
        "Supplier Name",
        `${monthNames[month - 1]} Total Score`,
        `${monthNames[month - 1]} Level`,
        `${monthNames[month - 1]} Rank`,
        `Cumulative ${monthNames[month - 1]} Total Score`,
        `Cumulative ${monthNames[month - 1]} Level`,
        `Cumulative ${monthNames[month - 1]} Rank`,
      ];

      // CSV Rows
      const rows = performances.map((item) => [
        item.bp_code,
        item.bp_name || "-",
        item.final_score,
        item.performance_grade,
        item.ranking,
        item.cumulative_final_score !== undefined ? item.cumulative_final_score : "-",
        item.cumulative_performance_grade || "-",
        item.cumulative_ranking !== undefined ? item.cumulative_ranking : "-",
      ]);

      // Create CSV content
      const csvContent =
        headers.join(",") +
        "\n" +
        rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `delivery-performance-${monthNames[month - 1]}-${year}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV downloaded successfully", {
        title: "Success",
      });
    } catch (err) {
      toast.error("Failed to download CSV", {
        title: "Error",
      });
    } finally {
      setDownloading(false);
    }
  };

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

  const columns: ColumnConfig[] = useMemo(() => [
    {
      key: "bp_code",
      label: "Supplier",
      sortable: true,
      render: (value: string, row: PerformanceData) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">{value}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{row.bp_name || "-"}</div>
        </div>
      ),
    },
    {
      key: "final_score",
      label: `${monthNames[month - 1]} - Total Score`,
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
      ),
    },
    {
      key: "performance_grade",
      label: `${monthNames[month - 1]} - Level`,
      sortable: true,
      render: (value: string) => (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getGradeColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: "ranking",
      label: `${monthNames[month - 1]} - Rank`,
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-gray-900 dark:text-white">#{value}</span>
      ),
    },
    {
      key: "cumulative_final_score",
      label: `Cumulative ${monthNames[month - 1]} - Total Score`,
      sortable: true,
      render: (value: number | undefined) => (
        <span className="font-semibold text-gray-900 dark:text-white">{value || "-"}</span>
      ),
    },
    {
      key: "cumulative_performance_grade",
      label: `Cumulative ${monthNames[month - 1]} - Level`,
      sortable: true,
      render: (value: string | undefined) => (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getGradeColor(value || "")}`}>
          {value || "-"}
        </span>
      ),
    },
    {
      key: "cumulative_ranking",
      label: `Cumulative ${monthNames[month - 1]} - Rank`,
      sortable: true,
      render: (value: number | undefined) => (
        <span className="font-semibold text-gray-900 dark:text-white">{value ? `#${value}` : "-"}</span>
      ),
    },
  ], [month]);

if (loading) {
  return (
    <>
      <PageMeta title="Delivery Performance" description="Monthly delivery performance summary" />
      <PageBreadcrumb pageTitle="Delivery Performance" />
      <SkeletonDeliveryPerformance />
    </>
  );
}

  return (
    <>
      <PageMeta title="Delivery Performance" description="Monthly delivery performance summary" />
      <PageBreadcrumb pageTitle="Delivery Performance" />

      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading performance data
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Data Table */}
        {!error && (
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <DataTableOne 
              title="Delivery Performance Resume Data"
              columns={columns} 
              data={performances} 
              defaultItemsPerPage={10}
              itemsPerPageOptions={[5, 10, 15, 20]}
              searchable={true}
              searchPlaceholder="Search suppliers..."
              emptyStateMessage={`No performance data found for ${monthNames[month - 1]} ${year}`}
              periodSelectors={
                <div className="flex items-center gap-3">
                  <div className="w-40">
                    <Select
                      value={month.toString()}
                      options={monthNames.map((m, idx) => ({
                        value: (idx + 1).toString(),
                        label: m,
                      }))}
                      placeholder="Select month"
                      onChange={(value) => setMonth(parseInt(value))}
                    />
                  </div>
                  <div className="w-32">
                    <Select
                      value={year.toString()}
                      options={[2024, 2025, 2026].map((y) => ({
                        value: y.toString(),
                        label: y.toString(),
                      }))}
                      placeholder="Select year"
                      onChange={(value) => setYear(parseInt(value))}
                    />
                  </div>
                </div>
              }
              actionButton={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCSV}
                  disabled={downloading || performances.length === 0}
                >
                  {downloading ? "Downloading..." : "Download CSV"}
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10.0018 14.083C9.7866 14.083 9.59255 13.9924 9.45578 13.8472L5.61586 10.0097C5.32288 9.71688 5.32272 9.242 5.61552 8.94902C5.90832 8.65603 6.3832 8.65588 6.67618 8.94868L9.25182 11.5227L9.25182 3.33301C9.25182 2.91879 9.5876 2.58301 10.0018 2.58301C10.416 2.58301 10.7518 2.91879 10.7518 3.33301L10.7518 11.5193L13.3242 8.94866C13.6172 8.65587 14.0921 8.65604 14.3849 8.94903C14.6777 9.24203 14.6775 9.7169 14.3845 10.0097L10.5761 13.8154C10.4385 13.979 10.2323 14.083 10.0018 14.083ZM4.0835 13.333C4.0835 12.9188 3.74771 12.583 3.3335 12.583C2.91928 12.583 2.5835 12.9188 2.5835 13.333V15.1663C2.5835 16.409 3.59086 17.4163 4.8335 17.4163H15.1676C16.4102 17.4163 17.4176 16.409 17.4176 15.1663V13.333C17.4176 12.9188 17.0818 12.583 16.6676 12.583C16.2533 12.583 15.9176 12.9188 15.9176 13.333V15.1663C15.9176 15.5806 15.5818 15.9163 15.1676 15.9163H4.8335C4.41928 15.9163 4.0835 15.5806 4.0835 15.1663V13.333Z"
                      fill="currentColor"
                    />
                  </svg>
                </Button>
              }
            />
          </div>
        )}

        {/* Number of Level */}
        {!error && (
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
            <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Number of Level</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Card */}
              <div className="rounded-2xl bg-gray-100 p-5 dark:bg-white/[0.03]">
                <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">{monthNames[month - 1]}</h4>
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-4">
                  <span className="text-gray-400 text-xs font-medium">Level</span>
                  <span className="text-right text-gray-400 text-xs font-medium">Total</span>
                </div>
                {performances.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(levelDistribution).map(([level, count]) => (
                      <div key={level} className="flex justify-between items-center py-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(level)}`}>
                          Level {level}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cumulative Card */}
              <div className="rounded-2xl bg-gray-100 p-5 dark:bg-white/[0.03]">
                <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Cumulative {monthNames[month - 1]}</h4>
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-4">
                  <span className="text-gray-400 text-xs font-medium">Level</span>
                  <span className="text-right text-gray-400 text-xs font-medium">Total</span>
                </div>
                {performances.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(cumulativeLevelDistribution).map(([level, count]) => (
                      <div key={level} className="flex justify-between items-center py-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(level)}`}>
                          Level {level}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Best Performers */}
        {!error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">The Best on {monthNames[month - 1]}</h3>
              <div className="my-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-400 text-xs">Supplier</span>
                  <span className="text-right text-gray-400 text-xs">Score</span>
                </div>
                {bestPerformers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No data available</p>
                  </div>
                ) : (
                  bestPerformers.map((performer, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                      <div>
                        <div className="text-gray-500 text-sm dark:text-gray-400">{performer.bp_code}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{performer.bp_name || "-"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-500 text-sm dark:text-gray-400 font-medium">{performer.final_score}</div>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(performer.performance_grade)}`}>
                          {performer.performance_grade}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">The Best on Cumulative {monthNames[month - 1]}</h3>
              <div className="my-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-400 text-xs">Supplier</span>
                  <span className="text-right text-gray-400 text-xs">Score</span>
                </div>
                {bestCumulativePerformers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No data available</p>
                  </div>
                ) : (
                  bestCumulativePerformers.map((performer, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                      <div>
                        <div className="text-gray-500 text-sm dark:text-gray-400">{performer.bp_code}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{performer.bp_name || "-"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-500 text-sm dark:text-gray-400 font-medium">{performer.final_score}</div>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(performer.performance_grade)}`}>
                          {performer.performance_grade}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Worst Performers */}
        {!error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">The Worst on {monthNames[month - 1]}</h3>
              <div className="my-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-400 text-xs">Supplier</span>
                  <span className="text-right text-gray-400 text-xs">Score</span>
                </div>
                {worstPerformers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No data available</p>
                  </div>
                ) : (
                  worstPerformers.map((performer, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                      <div>
                        <div className="text-gray-500 text-sm dark:text-gray-400">{performer.bp_code}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{performer.bp_name || "-"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-500 text-sm dark:text-gray-400 font-medium">{performer.final_score}</div>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(performer.performance_grade)}`}>
                          {performer.performance_grade}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">The Worst on Cumulative {monthNames[month - 1]}</h3>
              <div className="my-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-400 text-xs">Supplier</span>
                  <span className="text-right text-gray-400 text-xs">Score</span>
                </div>
                {worstCumulativePerformers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No data available</p>
                  </div>
                ) : (
                  worstCumulativePerformers.map((performer, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                      <div>
                        <div className="text-gray-500 text-sm dark:text-gray-400">{performer.bp_code}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{performer.bp_name || "-"}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-500 text-sm dark:text-gray-400 font-medium">{performer.final_score}</div>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(performer.performance_grade)}`}>
                          {performer.performance_grade}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DeliveryPerformance;