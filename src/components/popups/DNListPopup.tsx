import { X, ChevronLeft, Package } from "lucide-react";
import { useEffect, useState } from "react";

interface DNDetailItem {
  part_no: string;
  part_name?: string | null;
  qty_per_box?: number | null;
  expected_quantity: number;
  scanned_quantity: number;
  match_status?: string;
}

interface DNItem {
  dnNumber: string;
  quantityDN: number;
  quantityActual: number;
  status?: string;
  items?: DNDetailItem[];
}

interface DNListPopupProps {
  isOpen: boolean;
  onClose: () => void;
  dnList: DNItem[];
  supplier: string;
  platNumber: string;
}

export default function DNListPopup({ 
  isOpen, 
  onClose, 
  dnList, 
  supplier, 
  platNumber,
}: DNListPopupProps) {
  const [selectedDN, setSelectedDN] = useState<DNItem | null>(null);

  // Reset drill-down state when popup closes/opens
  useEffect(() => {
    if (!isOpen) {
      setSelectedDN(null);
    }
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedDN) {
          setSelectedDN(null);
        } else {
          onClose();
        }
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, selectedDN]);

  if (!isOpen) return null;

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "Completed":  return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "In Progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:           return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  const dnItems: DNDetailItem[] = selectedDN?.items ?? [];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={selectedDN ? () => setSelectedDN(null) : onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white dark:bg-[#171A2A] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedDN ? `Items - ${selectedDN.dnNumber}` : "Delivery Note List"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {supplier} · {platNumber}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* ── Content ── */}
          <div className="overflow-y-auto flex-1">

            {/* ===== LEVEL 1 — DN CARD LIST (same as original) ===== */}
            {!selectedDN && (
              <div className="p-4 space-y-3">
                {dnList.map((dn, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDN(dn)}
                    className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {dn.dnNumber}
                          </span>
                          {dn.status && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeClass(dn.status)}`}>
                              {dn.status}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Qty DN:</span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-white">
                              {dn.quantityDN.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Qty Actual:</span>
                            <span className={`ml-2 font-medium ${
                              dn.quantityActual === dn.quantityDN
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}>
                              {dn.quantityActual.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Chevron hint */}
                      <ChevronLeft className="w-4 h-4 rotate-180 text-gray-400 mt-1 flex-shrink-0" />
                    </div>
                  </button>
                ))}

                {/* Summary */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total DN:</span>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {dnList.length}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total Qty DN:</span>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {dnList.reduce((s, d) => s + d.quantityDN, 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total Qty Actual:</span>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {dnList.reduce((s, d) => s + d.quantityActual, 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== LEVEL 2 — ITEM DETAIL TABLE ===== */}
            {selectedDN && (
              <div className="p-4">
                {dnItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-gray-400 dark:text-gray-500">
                    <Package className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm">No item data available for this DN</p>
                    <p className="text-xs mt-1 text-gray-400">Item data may not have been scanned yet</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Table Header */}
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 w-10">No</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Part No</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Part Name</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Qty/Box</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {dnItems.map((item, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-400 dark:text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 font-mono text-gray-900 dark:text-white text-xs">
                              {item.part_no}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {item.part_name || "-"}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                              {item.qty_per_box != null ? item.qty_per_box.toLocaleString() : "-"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-semibold ${
                                item.expected_quantity > 0 && item.scanned_quantity >= item.expected_quantity
                                  ? "text-green-600 dark:text-green-400"
                                  : item.scanned_quantity > 0
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}>
                                {item.scanned_quantity.toLocaleString()}/{item.expected_quantity.toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Table Footer Summary */}
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-3 gap-4 text-sm text-center">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total Items</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{dnItems.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total Qty DN</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {dnItems.reduce((s, i) => s + i.expected_quantity, 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total Scanned</p>
                          <p className={`font-semibold ${
                            dnItems.reduce((s, i) => s + i.scanned_quantity, 0) >=
                            dnItems.reduce((s, i) => s + i.expected_quantity, 0)
                              ? "text-green-600 dark:text-green-400"
                              : "text-orange-600 dark:text-orange-400"
                          }`}>
                            {dnItems.reduce((s, i) => s + i.scanned_quantity, 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            {selectedDN ? (
              <button
                onClick={() => setSelectedDN(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Back to DN List
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}