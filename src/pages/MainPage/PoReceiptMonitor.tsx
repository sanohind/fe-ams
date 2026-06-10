import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PoReceiptDataGrid from "./PoReceiptDataGrid";

export default function PoReceiptMonitor() {
  return (
    <>
      <PageMeta
        title="PO Processing | AMS - Sanoh Indonesia"
        description="PO Processing page showing receipts and pickup history"
      />
      <PageBreadcrumb pageTitle="PO Processing" />

      <div className="space-y-8">
        <PoReceiptDataGrid status="pending" title="On Queue" showSummary={true} />
        <PoReceiptDataGrid status="picked_up" title="Dispatched" showSummary={false} />
      </div>
    </>
  );
}
