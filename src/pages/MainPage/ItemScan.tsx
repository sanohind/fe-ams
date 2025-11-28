import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne from "../../components/tables/DataTables/TableOne/DataTableOne";
import { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import ComponentCard from "../../components/common/ComponentCard";
import ConfirmationPopup from "../../components/popups/ConfirmationPopup";
import { useToast } from "../../hooks/useToast";
import apiService from "../../services/api";

// Interface untuk DN item dari SCM
interface DnItem {
  no: number;
  part_no: string;
  part_name: string;
  qty_per_box: number;
  total_quantity: number;
  scanned_quantity: number;
  progress: number;
  dn_detail_no: number;
}

interface ScanDnResponse {
  session?: {
    id: number;
    status: 'in_progress' | 'completed';
    session_start?: string;
  };
  arrival_id: number;
  dn_number: string;
  items?: DnItem[];
}

// Interface untuk scan session
interface ScanSession {
  id: number;
  arrivalId: number;
  operatorName: string;
  dnNumber: string;
  status: 'active' | 'completed';
  startedAt: string;
  completedAt?: string;
}

const columns: ColumnConfig[] = [
    {
        key: "no",
        label: "No",
        sortable: true,
    },
    {
        key: "part_no",
        label: "Part No",
        sortable: true,
    },
    {
        key: "part_name",
        label: "Part Name",
        sortable: true,
    },
    {
        key: "qty_per_box",
        label: "Qty/Box",
        sortable: true,
    },
    {
        key: "progress",
        label: "Progress",
        sortable: true,
        render: (value: number, row: DnItem) => (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min(value, 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium min-w-[50px] text-gray-900 dark:text-white">
              {row.scanned_quantity} / {row.total_quantity}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              ({value.toFixed(1)}%)
            </span>
          </div>
        ),
    },
]

const parseItemQrData = (qrString: string) => {
  const trimmed = qrString.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(";");
  if (parts.length < 7) return null;

  const [partNo, quantityStr, lotNumber,,,, dnNumber] = parts;
  const quantity = Number.parseInt(quantityStr ?? '', 10);

  if (!partNo || !lotNumber || !dnNumber || Number.isNaN(quantity) || quantity <= 0) {
    return null;
  }

  return {
    partNo: partNo.trim(),
    quantity,
    lotNumber: lotNumber.trim(),
    dnNumber: dnNumber.trim(),
  };
};

export default function ItemScan() {
  const toast = useToast();
  const [dnNumber, setDnNumber] = useState("");
  const [qrData, setQrData] = useState("");
  const [dnItems, setDnItems] = useState<DnItem[]>([]);
  const [currentSession, setCurrentSession] = useState<ScanSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [markingIncomplete, setMarkingIncomplete] = useState(false);
  const [showIncompleteConfirm, setShowIncompleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("DN Scan");
  const dnScanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemScanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionScanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasReadyForCompletionRef = useRef(false);
  const [completionDnScan, setCompletionDnScan] = useState("");

  const focusInput = useCallback((elementId: string) => {
    setTimeout(() => {
      const target = document.getElementById(elementId) as HTMLInputElement | null;
      target?.focus();
    }, 100);
  }, []);

  const totalRequiredQuantity = useMemo(
    () => dnItems.reduce((sum, item) => sum + (item.total_quantity || 0), 0),
    [dnItems]
  );

  const totalScannedQuantity = useMemo(
    () => dnItems.reduce((sum, item) => sum + (item.scanned_quantity || 0), 0),
    [dnItems]
  );

  const isReadyToComplete = Boolean(currentSession) && totalRequiredQuantity > 0 && totalScannedQuantity >= totalRequiredQuantity;

  useEffect(() => {
    if (isReadyToComplete) {
      setPageTitle("Complete Session");
    } else if (currentSession) {
      setPageTitle("Label Scan");
    } else {
      setPageTitle("DN Scan");
    }
  }, [isReadyToComplete, currentSession]);

  useEffect(() => {
    if (!currentSession) {
      wasReadyForCompletionRef.current = false;
      focusInput('dn-scan-input');
    } else if (isReadyToComplete) {
      if (!wasReadyForCompletionRef.current) {
        setCompletionDnScan("");
      }
      wasReadyForCompletionRef.current = true;
      focusInput('completion-scan-input');
    } else {
      wasReadyForCompletionRef.current = false;
      focusInput('item-scan-input');
    }
  }, [currentSession, isReadyToComplete, focusInput]);

  const fetchDnItems = useCallback(async (dn: string) => {
    try {
      const response = await apiService.getDnItemsList(dn);
      const data = response.data as { items?: DnItem[] } | undefined;

      if (response.success && data?.items) {
        setDnItems(data.items);
      }
    } catch (err: any) {
      console.error("Failed to fetch DN items:", err);
    }
  }, []);

  // Handle DN QR scan
  const handleDnScan = useCallback(async () => {
    if (!dnNumber.trim()) {
      setError("Please enter DN number");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.scanDn({
        dn_number: dnNumber.trim()
      });

      if (response.success && response.data) {
        toast.success("DN scanned successfully!", { title: 'Scan Success' });
        
        // Set session from response
        const data = response.data as ScanDnResponse | undefined;

        if (data?.session) {
          setCurrentSession({
            id: data.session.id,
            arrivalId: data.arrival_id,
            operatorName: "Current User", // TODO: Get from auth context
            dnNumber: data.dn_number,
            status: data.session.status === 'in_progress' ? 'active' : 'completed',
            startedAt: data.session.session_start || new Date().toISOString(),
          });
        }
        
        // Set DN items from response
        if (data?.items && Array.isArray(data.items)) {
          setDnItems(data.items);
        } else {
          // If items not in response, fetch them
          await fetchDnItems(dnNumber.trim());
        }

        setQrData("");
        setCompletionDnScan("");
        wasReadyForCompletionRef.current = false;

      } else {
        const errorMsg = response.message || "Failed to scan DN";
        setError(errorMsg);
        toast.error(errorMsg, { title: 'Scan Failed' });
        setDnNumber("");
        focusInput('dn-scan-input');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to scan DN";
      setError(errorMsg);
      toast.error(errorMsg, { title: 'Scan Failed' });
      setDnNumber("");
      focusInput('dn-scan-input');
    } finally {
      setLoading(false);
    }
  }, [dnNumber, loading, fetchDnItems, focusInput]);

  // Handle Enter key press for auto-submit (using onKeyDown for better scanner compatibility)
  const handleDnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && dnNumber.trim() && !loading) {
      e.preventDefault();
      handleDnScan();
    }
  };

  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && qrData.trim() && !loading && currentSession && !isReadyToComplete) {
      e.preventDefault();
      handleItemScan();
    }
  };


  // Handle item QR scan
  const handleItemScan = useCallback(async () => {
    if (loading) return;

    const trimmedQr = qrData.trim();

    if (!trimmedQr) {
      const errorMsg = "Please enter QR data";
      setError(errorMsg);
      toast.error(errorMsg, { title: 'Invalid Input' });
      return;
    }

    if (!currentSession) {
      const errorMsg = "Please scan DN first to start session";
      setError(errorMsg);
      toast.error(errorMsg, { title: 'No Active Session' });
      return;
    }

    if (isReadyToComplete) {
      const errorMsg = "All items are already scanned. Please complete the session.";
      setError(errorMsg);
      toast.warning(errorMsg, { title: 'Session Complete' });
      return;
    }

    const parsedQr = parseItemQrData(trimmedQr);

    if (!parsedQr) {
      const errorMsg = "Invalid item QR code format";
      setError(errorMsg);
      toast.error(errorMsg, { title: 'Invalid QR Format' });
      setQrData("");
      focusInput('item-scan-input');
      return;
    }

    if (parsedQr.dnNumber !== currentSession.dnNumber) {
      const errorMsg = `DN number mismatch. Label DN (${parsedQr.dnNumber}) does not match active session DN (${currentSession.dnNumber}).`;
      setError(errorMsg);
      toast.error(errorMsg, { title: 'DN Mismatch' });
      setQrData("");
      focusInput('item-scan-input');
      return;
    }

    const dnItem = dnItems.find((item) => item.part_no === parsedQr.partNo);

    if (!dnItem) {
      const errorMsg = `Part number (${parsedQr.partNo}) not found in DN details.`;
      setError(errorMsg);
      toast.error(errorMsg, { title: 'Part Not Found' });
      setQrData("");
      focusInput('item-scan-input');
      return;
    }

    if (dnItem.scanned_quantity + parsedQr.quantity > dnItem.total_quantity) {
      const remaining = Math.max(dnItem.total_quantity - dnItem.scanned_quantity, 0);
      const errorMsg = `Scanned quantity for part number ${parsedQr.partNo} exceeds required total. Remaining quantity: ${remaining}`;
      setError(errorMsg);
      toast.error(errorMsg, { title: 'Quantity Over' });
      setQrData("");
      focusInput('item-scan-input');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiService.scanItem({
        session_id: currentSession.id,
        qr_data: trimmedQr,
      });

      if (response.success) {
        toast.success("Item scanned successfully!", { title: 'Scan Success' });
        setQrData("");
        if (itemScanTimeoutRef.current) {
          clearTimeout(itemScanTimeoutRef.current);
        }
        await fetchDnItems(currentSession.dnNumber);
        focusInput('item-scan-input');
      } else {
        const errorMsg = response.message || "Failed to scan item";
        setError(errorMsg);
        toast.error(errorMsg, { title: 'Scan Failed' });
        setQrData("");
        focusInput('item-scan-input');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to scan item";
      setError(errorMessage);
      toast.error(errorMessage, { title: 'Scan Failed' });
      if (err.response?.status !== 409) {
        setQrData("");
      }
      focusInput('item-scan-input');
    } finally {
      setLoading(false);
    }
  }, [loading, qrData, currentSession, isReadyToComplete, dnItems, fetchDnItems, focusInput]);

  const handleCompletionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && completionDnScan.trim() && !loading && currentSession && isReadyToComplete) {
      e.preventDefault();
      handleCompletionScan();
    }
  };

  const handleCompletionScan = useCallback(async () => {
    if (!currentSession || !isReadyToComplete || loading) {
      return;
    }

    const trimmedCompletion = completionDnScan.trim();

    if (!trimmedCompletion) {
      const errorMsg = "Please scan DN number to complete the session";
      setError(errorMsg);
      toast.error(errorMsg, { title: 'Invalid Input' });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiService.completeScanSession(currentSession.id, {
        completion_dn_number: trimmedCompletion,
      });

      if (response.success) {
        toast.success("Scan session completed successfully!", { title: 'Success' });
        setCurrentSession(null);
        setDnItems([]);
        setDnNumber("");
        setQrData("");
        setCompletionDnScan("");
        wasReadyForCompletionRef.current = false;

        focusInput('dn-scan-input');
      } else {
        const errorMsg = response.message || "Failed to complete scan session";
        setError(errorMsg);
        toast.error(errorMsg, { title: 'Error' });
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to complete scan session";
      setError(errorMsg);
      toast.error(errorMsg, { title: 'Error' });
    } finally {
      setLoading(false);
    }
  }, [currentSession, isReadyToComplete, loading, completionDnScan, focusInput]);

  const handleMarkIncomplete = useCallback(() => {
    if (!currentSession || markingIncomplete) {
      return;
    }
    setShowIncompleteConfirm(true);
  }, [currentSession, markingIncomplete]);

  const confirmMarkIncomplete = useCallback(async () => {
    if (!currentSession || markingIncomplete) {
      return;
    }

    try {
      setMarkingIncomplete(true);
      await apiService.markArrivalIncomplete(currentSession.arrivalId);
      toast.success("DN marked as incomplete quantity. You can continue scanning when remaining items arrive.", { title: 'Success' });
      
      // Clear all state to return to initial scan page
      // Session remains in database with status 'in_progress' so it can be resumed later
      setCurrentSession(null);
      setDnItems([]);
      setDnNumber("");
      setQrData("");
      setCompletionDnScan("");
      wasReadyForCompletionRef.current = false;
      
      // Focus on DN scan input to allow user to scan another DN or resume this one later
      focusInput('dn-scan-input');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to mark DN as incomplete quantity";
      setError(errorMsg);
      toast.error(errorMsg, { title: 'Action Failed' });
    } finally {
      setMarkingIncomplete(false);
      setShowIncompleteConfirm(false);
    }
  }, [currentSession, markingIncomplete, toast, focusInput]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Auto-submit DN scan when format detected
  useEffect(() => {
    if (dnNumber.trim().length >= 8 && 
        dnNumber.trim().toUpperCase().startsWith('DN') && 
        !loading && 
        pageTitle === "DN Scan") {
      // Clear previous timeout
      if (dnScanTimeoutRef.current) {
        clearTimeout(dnScanTimeoutRef.current);
      }
      // Auto-submit after scanner finishes (300ms delay)
      dnScanTimeoutRef.current = setTimeout(() => {
        if (dnNumber.trim().length >= 8 && 
            dnNumber.trim().toUpperCase().startsWith('DN') && 
            !loading) {
          handleDnScan();
        }
      }, 300);
    }
    return () => {
      if (dnScanTimeoutRef.current) {
        clearTimeout(dnScanTimeoutRef.current);
      }
    };
  }, [dnNumber, loading, pageTitle, handleDnScan]);

  // Auto-submit item scan when format detected
  useEffect(() => {
    if (qrData.includes(';') && 
        qrData.trim().length >= 20 && 
        !loading && 
        currentSession && 
        !isReadyToComplete) {
      // Clear previous timeout
      if (itemScanTimeoutRef.current) {
        clearTimeout(itemScanTimeoutRef.current);
      }
      // Auto-submit after scanner finishes (300ms delay)
      itemScanTimeoutRef.current = setTimeout(() => {
        if (qrData.includes(';') && 
            qrData.trim().length >= 20 && 
            !loading && 
            currentSession && 
            !isReadyToComplete) {
          handleItemScan();
        }
      }, 300);
    }
    return () => {
      if (itemScanTimeoutRef.current) {
        clearTimeout(itemScanTimeoutRef.current);
      }
    };
  }, [qrData, loading, currentSession, isReadyToComplete, handleItemScan]);

  useEffect(() => {
    if (!isReadyToComplete || !currentSession) {
      if (completionScanTimeoutRef.current) {
        clearTimeout(completionScanTimeoutRef.current);
      }
      return;
    }

    const trimmedCompletion = completionDnScan.trim().toUpperCase();

    if (trimmedCompletion.length >= 8 && trimmedCompletion.startsWith('DN') && !loading) {
      if (completionScanTimeoutRef.current) {
        clearTimeout(completionScanTimeoutRef.current);
      }

      completionScanTimeoutRef.current = setTimeout(() => {
        if (!loading && isReadyToComplete) {
          handleCompletionScan();
        }
      }, 300);
    }

    return () => {
      if (completionScanTimeoutRef.current) {
        clearTimeout(completionScanTimeoutRef.current);
      }
    };
  }, [completionDnScan, isReadyToComplete, currentSession, loading, handleCompletionScan]);
 
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (dnScanTimeoutRef.current) {
        clearTimeout(dnScanTimeoutRef.current);
      }
      if (itemScanTimeoutRef.current) {
        clearTimeout(itemScanTimeoutRef.current);
      }
      if (completionScanTimeoutRef.current) {
        clearTimeout(completionScanTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <PageMeta
        title="Item Scan | SPHERE by SANOH Indonesia"
        description="This is React.js Data Tables Dashboard page for SPHERE by SANOH Indonesia"
      />
      <PageBreadcrumb pageTitle="Item Scan" />
      
      <div className="space-y-5 sm:space-y-6">
        {/* DN Scan Section */}
        <ComponentCard title={pageTitle}>
          <div className="space-y-4">
            {pageTitle === "DN Scan" && (
              <>
                <div>
                  <Label>DN Number</Label>
                  <Input
                    id="dn-scan-input"
                    type="text"
                    value={dnNumber}
                    onChange={(e) => setDnNumber(e.target.value)}
                    onKeyDown={handleDnKeyDown}
                    placeholder="Scan container QR code to load case data..."
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={handleDnScan}
                  disabled={loading || !dnNumber.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  {loading ? "Scanning..." : "Scan Container"}
                </button>
              </>
            )}

            {pageTitle === "Label Scan" && (
              <div>
                <Label>Part Number</Label>
                <Input
                  id="item-scan-input"
                  type="text"
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  onKeyDown={handleItemKeyDown}
                  placeholder="Scan part number label..."
                  disabled={loading}
                />
              </div>
            )}

            {pageTitle === "Complete Session" && (
              <div className="space-y-2">
                <div>
                  <Label>Complete Session - Scan DN Number</Label>
                  <Input
                    id="completion-scan-input"
                    type="text"
                    value={completionDnScan}
                    onChange={(e) => setCompletionDnScan(e.target.value)}
                    onKeyDown={handleCompletionKeyDown}
                    placeholder="Scan DN number to complete session..."
                    disabled={loading}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All items have been scanned. Confirm the DN number to complete this session.
                </p>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Scan Progress Section - Show DN Items */}
        {dnItems.length > 0 && (
          <ComponentCard title="Scan Progress">
            <div className="space-y-4">
              {currentSession && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">
                    Active Session: {currentSession.dnNumber}
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Operator: {currentSession.operatorName} | Started: {new Date(currentSession.startedAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Progress: {totalScannedQuantity} / {totalRequiredQuantity} items scanned
                  </p>
                </div>
              )}

              <DataTableOne   
                title=""
                data={dnItems}
                columns={columns}
                defaultItemsPerPage={10}
                itemsPerPageOptions={[5, 10, 15, 20]}
                defaultSortKey="no"
                defaultSortOrder="asc"
                searchable={true}
                searchPlaceholder="Search Part numbers..."
              />

              {currentSession && (
                <div className="flex justify-end">
                  <button
                    onClick={handleMarkIncomplete}
                    disabled={loading || markingIncomplete}
                    className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {markingIncomplete ? "Marking..." : "Mark as Incomplete Qty"}
                  </button>
                </div>
              )}
            </div>
          </ComponentCard>
        )}

        {/* Confirmation Popup for Mark as Incomplete Qty */}
        <ConfirmationPopup
          isOpen={showIncompleteConfirm}
          onClose={() => setShowIncompleteConfirm(false)}
          onConfirm={confirmMarkIncomplete}
          title="Mark as Incomplete Quantity"
          message="Are you sure you want to mark this DN as incomplete quantity? The scanning session will be paused and you can continue scanning when the remaining items arrive via additional delivery."
          confirmText="Mark as Incomplete"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    </>
  );    
}
