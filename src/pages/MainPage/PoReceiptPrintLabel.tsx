import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  BlobProvider,
  Font,
} from "@react-pdf/renderer";

// ─── Register Font ─────────────────────────────────────────────────────────────
Font.register({
  family: "Poppins",
  fonts: [
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});

// ─── Thermal Paper Constants ────────────────────────────────────────────────
// 1mm = 2.8346pt
const MM_TO_PT = 2.8346;
const PAPER_WIDTH_MM = 80;
const PAPER_WIDTH_PT = PAPER_WIDTH_MM * MM_TO_PT; // ≈226.77pt

// Each label height estimation: header row + 4 data rows + padding
// header ~10pt + 4 rows × ~12pt + borders + padding ≈ 80pt
const LABEL_HEIGHT_PT = 65;
const PAGE_PADDING_PT = 10;

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 6,
    paddingVertical: PAGE_PADDING_PT,
    fontSize: 6,
    fontFamily: "Poppins",
    backgroundColor: "#fff",
    width: PAPER_WIDTH_PT,
  },
  // Each label takes full width
  labelCard: {
    width: "100%",
  },
  table: {
    border: "0.75pt solid #000",
    width: "100%",
  },
  // Header row: QCC text left, Rec Date right (no border)
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 3,
    paddingBottom: 2,
  },
  headerText: {
    fontSize: 5,
  },
  // Data rows
  row: {
    flexDirection: "row",
    borderBottom: "0.75pt solid #000",
  },
  rowLast: {
    flexDirection: "row",
  },
  labelCell: {
    width: "22%",
    borderRight: "0.75pt solid #000",
    padding: "1.5 5",
    justifyContent: "center",
  },
  valueCell: {
    flex: 1,
    padding: "1.5 5",
    justifyContent: "center",
  },
  valueCellBordered: {
    flex: 1.5,
    borderRight: "0.75pt solid #000",
    padding: "1.5 5",
    justifyContent: "center",
  },
  labelCellSmall: {
    width: "20%",
    borderRight: "0.75pt solid #000",
    padding: "1.5 5",
    justifyContent: "center",
  },
  labelText: {
    fontSize: 6,
    fontWeight: "bold",
  },
  valueText: {
    fontSize: 6,
  },
});

// ─── Interfaces ────────────────────────────────────────────────────────────────
interface LabelItem {
  po_no: string;
  supplier: string;
  part_name: string;
  buyer: string;
  received_by: string;
  printed_date: string;
  effective_receipt_date: string;
}

interface RawLabelItem {
  id: number;
  po_no: string;
  bp_name: string | null;
  desc: string | null;
  buyer: string | null;
  receipt_date_erp: string | null;
  receipt_date_local: string | null;
  effective_receipt_date: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateForLabel(isoString: string | null): string {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "-";
  const day   = d.getDate();
  const month = d.getMonth() + 1;
  const year  = d.getFullYear();
  const hh    = String(d.getHours()).padStart(2, "0");
  const mm    = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hh}.${mm}`;
}

/** Format only the date part (no time) for the corner header */
function formatDateOnly(isoString: string | null): string {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "-";
  const day   = d.getDate();
  const month = d.getMonth() + 1;
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ─── PDF Document ─────────────────────────────────────────────────────────────
// One page per label
const LabelDocument = ({ items }: { items: LabelItem[] }) => {
  const pageHeight = LABEL_HEIGHT_PT + PAGE_PADDING_PT * 2;

  return (
    <Document title="PO Receipt Labels">
      {items.map((item, idx) => (
        <Page
          key={idx}
          style={styles.page}
          size={[PAPER_WIDTH_PT, pageHeight]}
        >
          {/* ── Label card ── */}
          <View style={styles.labelCard} wrap={false}>
              {/* Header: QCC left | Rec. Date right — no border */}
              <View style={styles.headerRow}>
                <Text style={styles.headerText}>QCC-Wireless-2026</Text>
                <Text style={styles.headerText}>Receipt Date: {item.effective_receipt_date}</Text>
              </View>

              <View style={styles.table}>
                {/* Row 1: PO NO */}
                <View style={styles.row}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>PO NO</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{item.po_no}</Text>
                  </View>
                </View>

                {/* Row 2: SUPPLIER */}
                <View style={styles.row}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>SUPPLIER</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{item.supplier}</Text>
                  </View>
                </View>

                {/* Row 3: PART NAME */}
                <View style={styles.row}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>PART NAME</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{item.part_name}</Text>
                  </View>
                </View>

                {/* Row 4: BUYER & RECEIVED BY (last row) */}
                <View style={styles.rowLast}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>BUYER</Text>
                  </View>
                  <View style={styles.valueCellBordered}>
                    <Text style={styles.valueText}>{item.buyer}</Text>
                  </View>
                  <View style={styles.labelCellSmall}>
                    <Text style={styles.labelText}>RECEIVED BY</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{item.received_by}</Text>
                  </View>
                </View>
              </View>
            </View>
        </Page>
      ))}
    </Document>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PoReceiptPrintLabel() {
  const [searchParams] = useSearchParams();
  const dataParam  = searchParams.get("data");
  const receivedBy = searchParams.get("received_by") ?? "-";

  const [labelItems, setLabelItems] = useState<LabelItem[] | null>(null);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (!dataParam) {
      setError("No label data provided.");
      return;
    }

    try {
      const rawItems: RawLabelItem[] = JSON.parse(decodeURIComponent(dataParam));

      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        setError("Invalid label data.");
        return;
      }

      const processed: LabelItem[] = rawItems.map((item) => {
        const bpName = item.bp_name ?? "-";
        const desc = item.desc ?? "-";
        
        return {
          po_no:                  item.po_no ?? "-",
          supplier:               bpName.length > 40 ? bpName.substring(0, 40) + "..." : bpName,
          part_name:              desc.length > 40 ? desc.substring(0, 40) + "..." : desc,
          effective_receipt_date: formatDateOnly(item.effective_receipt_date),
          buyer:                  item.buyer ?? "-",
          received_by:            receivedBy.length > 14 ? receivedBy.substring(0, 14) + "..." : receivedBy,
          printed_date:           formatDateForLabel(new Date().toISOString()),
        };
      });

      setLabelItems(processed);
    } catch {
      setError("Failed to parse label data.");
    }
  }, [dataParam, receivedBy]);

  // ── Inject @page CSS to force portrait orientation ──────────────────────────
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.id = "print-portrait-override";
    styleEl.textContent = `@page { size: portrait; margin: 0; }`;
    document.head.appendChild(styleEl);
    return () => {
      document.getElementById("print-portrait-override")?.remove();
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
          <p className="text-red-800 font-semibold text-lg">Error</p>
          <p className="text-red-600 mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!labelItems) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-gray-700 font-medium">Generating labels, please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <BlobProvider document={<LabelDocument items={labelItems} />}>
      {({ url, loading, error: pdfError }) => {
        if (loading) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                <p className="text-gray-700 font-medium">Rendering PDF, please wait...</p>
              </div>
            </div>
          );
        }
        if (pdfError) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
                <p className="text-red-800 font-semibold text-lg">PDF Render Error</p>
                <p className="text-red-600 mt-2 text-sm">{pdfError.message}</p>
              </div>
            </div>
          );
        }
        return (
          <div className="w-screen h-screen">
            <iframe
              src={url ?? ""}
              className="w-full h-full border-0"
              title="PO Receipt Labels"
            />
          </div>
        );
      }}
    </BlobProvider>
  );
}
