import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne from "../../components/tables/DataTables/TableOne/DataTableOne";
import { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import ComponentCard from "../../components/common/ComponentCard";

const itemData = [
    {
        no: 1,
        partNo: "PT-2025-001",
        partName: "Brake Pad Assembly",
        lotNo: "LOT-2025-001",
        quantity: 150,
        status: "Scanned",
    },
    {
        no: 2,
        partNo: "PT-2025-002",    
        partName: "Engine Mount Bracket",
        lotNo: "LOT-2025-002",
        quantity: 200,
        status: "Not Scanned",
    },
    {
        no: 3,
        partNo: "PT-2025-003",
        partName: "Fuel Injector Valve",
        lotNo: "LOT-2025-003",
        quantity: 100,
        status: "Scanned",
    },
]

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
  return (
    <>
      <PageMeta
        title="Item Scan | SPHERE by SANOH Indonesia"
        description="This is React.js Data Tables Dashboard page for SPHERE by SANOH Indonesia"
      />
      <PageBreadcrumb pageTitle="Item Scan" />
        <div className="space-y-5 sm:space-y-6">
            <ComponentCard title="Item Scan">
            <div>
                <Label>DN Number</Label>
                <Input type="text" id="inputTwo" placeholder="DNXXXXXXX" />
            </div>
            </ComponentCard>
            <DataTableOne   
                title="Item Scan Results"
                data={itemData}
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
