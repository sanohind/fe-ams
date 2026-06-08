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
const PAPER_WIDTH_MM  = 80;
const PAPER_WIDTH_PT  = PAPER_WIDTH_MM * MM_TO_PT; // ≈226.77pt

// Each label height estimation (for total page height calculation):
// 5 rows × ~18pt + borders + padding ≈ 120pt
const LABEL_HEIGHT_PT    = 120;
const PAGE_PADDING_PT    =  10;
const LABEL_GAP_PT       =   6;

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 6,
    paddingVertical: PAGE_PADDING_PT,
    fontSize: 8,
    fontFamily: "Poppins",
    backgroundColor: "#fff",
    width: PAPER_WIDTH_PT,
  },
  // Each label takes full width; a thin separator line below
  labelCard: {
    width: "100%",
    marginBottom: LABEL_GAP_PT,
  },
  separator: {
    borderBottom: "0.75pt dashed #aaa",
    marginBottom: LABEL_GAP_PT,
  },
  table: {
    border: "0.75pt solid #000",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    borderBottom: "0.75pt solid #000",
  },
  rowLast: {
    flexDirection: "row",
  },
  labelCell: {
    width: "38%",
    borderRight: "0.75pt solid #000",
    padding: "3 5",
    justifyContent: "center",
  },
  valueCell: {
    flex: 1,
    padding: "3 5",
    justifyContent: "center",
  },
  labelText: {
    fontSize: 8,
    fontWeight: "bold",
  },
  valueText: {
    fontSize: 8,
  },
});

// ─── Interfaces ────────────────────────────────────────────────────────────────
interface LabelItem {
  po_no: string;
  effective_receipt_date: string;
  buyer: string;
  received_by: string;
  printed_date: string;
}

interface RawLabelItem {
  id: number;
  po_no: string;
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

// ─── PDF Document ─────────────────────────────────────────────────────────────
// Single continuous thermal-roll page: 80mm wide × computed height
const LabelDocument = ({ items }: { items: LabelItem[] }) => {
  // Compute total page height: padding top + bottom + (label + gap) × n − last gap
  const totalHeight =
    PAGE_PADDING_PT * 2 +
    items.length * LABEL_HEIGHT_PT +
    Math.max(0, items.length - 1) * LABEL_GAP_PT;

  return (
    <Document title="PO Receipt Labels">
      <Page
        style={styles.page}
        size={[PAPER_WIDTH_PT, totalHeight]}
      >
        {items.map((item, idx) => (
          <View key={idx}>
            {/* ── Label card ── */}
            <View style={styles.labelCard}>
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

                {/* Row 2: RECEIPT DATE */}
                <View style={styles.row}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>RECEIPT DATE</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{item.effective_receipt_date}</Text>
                  </View>
                </View>

                {/* Row 3: BUYER */}
                <View style={styles.row}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>BUYER</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{item.buyer}</Text>
                  </View>
                </View>

                {/* Row 4: RECEIVED BY */}
                <View style={styles.row}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>RECEIVED BY</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{item.received_by}</Text>
                  </View>
                </View>

                {/* Row 5: PRINTED DATE (no bottom border — last row) */}
                <View style={styles.rowLast}>
                  <View style={styles.labelCell}>
                    <Text style={styles.labelText}>PRINTED DATE</Text>
                  </View>
                  <View style={styles.valueCell}>
                    <Text style={styles.valueText}>{item.printed_date}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Dashed separator between labels (skip after last) ── */}
            {idx < items.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </Page>
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

      const printedDate = formatDateForLabel(new Date().toISOString());

      const processed: LabelItem[] = rawItems.map((item) => ({
        po_no:                  item.po_no ?? "-",
        effective_receipt_date: formatDateForLabel(item.effective_receipt_date),
        buyer:                  item.buyer ?? "-",
        received_by:            receivedBy,
        printed_date:           printedDate,
      }));

      setLabelItems(processed);
    } catch {
      setError("Failed to parse label data.");
    }
  }, [dataParam, receivedBy]);

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
