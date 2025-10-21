import { X } from "lucide-react";
import { useEffect } from "react";

interface DNItem {
  dnNumber: string;
  quantityDN: number;
  quantityActual: number;
  status?: string;
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
  platNumber 
}: DNListPopupProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white dark:bg-[#171A2A] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delivery Note List
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {supplier} - {platNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
            <div className="space-y-3">
              {dnList.map((dn, index) => (
                <div 
                  key={index}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {dn.dnNumber}
                        </span>
                        {dn.status && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            dn.status === "Completed" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : dn.status === "In Progress"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}>
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
                  </div>
                </div>
              ))}
            </div>

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
                    {dnList.reduce((sum, dn) => sum + dn.quantityDN, 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Total Qty Actual:</span>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {dnList.reduce((sum, dn) => sum + dn.quantityActual, 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}