import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne from "../../components/tables/DataTables/TableOne/DataTableOne";
import { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import ComponentCard from "../../components/common/ComponentCard";
import apiService from "../../services/api";

// Interface untuk scanned item
interface ScannedItem {
  id: number;
  no: number;
  partNo: string;
  partName: string;
  lotNo: string;
  quantity: number;
  customer: string;
  dnNumber: string;
  status: 'Scanned' | 'Not Scanned';
  scannedAt?: string;
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
  scannedItems: ScannedItem[];
}

const columns: ColumnConfig[] = [
    {
        key: "no",
        label: "No",
        sortable: true,
    },
    {
        key: "partNo",
        label: "Part No",
        sortable: true,
    },
    {
        key: "partName",
        label: "Part Name",
        sortable: true,
    },
    {
        key: "lotNo",
        label: "Lot No",
        sortable: true,
    },
    {
        key: "quantity",
        label: "Quantity",
        sortable: true,
    },
    {
        key: "customer",
        label: "Customer",
        sortable: true,
    },
    {
        key: "dnNumber",
        label: "DN Number",
        sortable: true,
    },
    {
        key: "status",
        label: "Status",
        sortable: true,
        render: (value: string) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              value === "Scanned"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {value}
          </span>
        ),
    },
]

export default function ItemScan() {
  const [dnNumber, setDnNumber] = useState("");
  const [qrData, setQrData] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [currentSession, setCurrentSession] = useState<ScanSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle DN QR scan
  const handleDnScan = async () => {
    if (!dnNumber.trim()) {
      setError("Please enter DN number");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.scanDn({
        arrival_id: 1, // This should come from arrival selection
        qr_data: dnNumber
      });

      if (response.success) {
        setSuccess("DN scanned successfully!");
        // Start scan session
        await startScanSession();
      } else {
        setError(response.message || "Failed to scan DN");
      }
    } catch (err: any) {
      setError(err.message || "Failed to scan DN");
    } finally {
      setLoading(false);
    }
  };

  // Handle item QR scan
  const handleItemScan = async () => {
    if (!qrData.trim()) {
      setError("Please enter QR data");
      return;
    }

    if (!currentSession) {
      setError("Please scan DN first to start session");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.scanItem({
        session_id: currentSession.id,
        qr_data: qrData
      });

      if (response.success) {
        setSuccess("Item scanned successfully!");
        setQrData("");
        // Refresh scanned items
        await fetchScanSession();
      } else {
        setError(response.message || "Failed to scan item");
      }
    } catch (err: any) {
      setError(err.message || "Failed to scan item");
    } finally {
      setLoading(false);
    }
  };

  // Start scan session
  const startScanSession = async () => {
    try {
      const response = await apiService.startScanSession({
        arrival_id: 1, // This should come from arrival selection
        operator_name: "Current User" // This should come from auth context
      });

      if (response.success) {
        setCurrentSession(response.data);
        await fetchScanSession();
      }
    } catch (err: any) {
      setError(err.message || "Failed to start scan session");
    }
  };

  // Fetch scan session details
  const fetchScanSession = async () => {
    if (!currentSession) return;

    try {
      const response = await apiService.getScanSession(currentSession.id);
      if (response.success) {
        setCurrentSession(response.data);
        setScannedItems(response.data.scannedItems || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch scan session:", err);
    }
  };

  // Complete scan session
  const completeScanSession = async () => {
    if (!currentSession) return;

    try {
      setLoading(true);
      const response = await apiService.completeScanSession(currentSession.id, {
        quality_checks: {
          label_check: true,
          coa_msds_check: true,
          packing_check: true
        },
        notes: "Quality checks completed"
      });

      if (response.success) {
        setSuccess("Scan session completed successfully!");
        setCurrentSession(null);
        setScannedItems([]);
        setDnNumber("");
      } else {
        setError(response.message || "Failed to complete scan session");
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete scan session");
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <>
      <PageMeta
        title="Item Scan | SPHERE by SANOH Indonesia"
        description="This is React.js Data Tables Dashboard page for SPHERE by SANOH Indonesia"
      />
      <PageBreadcrumb pageTitle="Item Scan" />
      
      <div className="space-y-5 sm:space-y-6">
        {/* DN Scan Section */}
        <ComponentCard title="DN Scan">
          <div className="space-y-4">
            <div>
              <Label>DN Number</Label>
              <Input 
                type="text" 
                value={dnNumber}
                onChange={(e) => setDnNumber(e.target.value)}
                placeholder="DN0030176" 
                disabled={loading}
              />
            </div>
            <button
              onClick={handleDnScan}
              disabled={loading || !dnNumber.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Scanning..." : "Scan DN"}
            </button>
          </div>
        </ComponentCard>

        {/* Item Scan Section */}
        {currentSession && (
          <ComponentCard title="Item Scan">
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 dark:text-blue-200">
                  Active Session: {currentSession.dnNumber}
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Operator: {currentSession.operatorName} | Started: {new Date(currentSession.startedAt).toLocaleString()}
                </p>
              </div>
              
              <div>
                <Label>Item QR Code</Label>
                <Input 
                  type="text" 
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  placeholder="RL1IN047371BZ3000000;450;PL2502055080801018;TMI;7;1;DN0030176;4" 
                  disabled={loading}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleItemScan}
                  disabled={loading || !qrData.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Scanning..." : "Scan Item"}
                </button>
                
                <button
                  onClick={completeScanSession}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Complete Session
                </button>
              </div>
            </div>
          </ComponentCard>
        )}

        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="text-sm text-green-700 dark:text-green-300">{success}</div>
          </div>
        )}

        {/* Scanned Items Table */}
        <DataTableOne   
          title="Scanned Items"
          data={scannedItems}
          columns={columns}
          defaultItemsPerPage={10}
          itemsPerPageOptions={[5, 10, 15, 20]}
          defaultSortKey="no"
          defaultSortOrder="asc"
          searchable={true}
          searchPlaceholder="Search Part numbers..."
        />
      </div>
    </>
  );    
}
