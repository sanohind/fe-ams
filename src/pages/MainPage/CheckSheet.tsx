import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne from "../../components/tables/DataTables/TableOne/DataTableOne";
import { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";

// Interface untuk data
interface CheckSheetData {
  no: number;
  supplier: string;
  dn_number: string;
  schedule: string;
  driver_name: string;
  plat_no: string;
  dock: string;
  check_labelPort: boolean;
  check_COA_MSDS: boolean;
  check_packing_label: boolean;
}

export default function CheckSheet() {
  const [data, setData] = useState<CheckSheetData[]>([
    {
      no: 1,
      supplier: "PT. Mitra Jaya",
      dn_number: "DN-2025-001",
      schedule: "08:00",
      driver_name: "John Doe",
      plat_no: "B 1234 XYZ",
      dock: "2",
      check_labelPort: true,
      check_COA_MSDS: true,
      check_packing_label: false,
    },
    {
      no: 2,
      supplier: "PT. Sejahtera Abadi",
      dn_number: "DN-2025-002",
      schedule: "09:30",
      driver_name: "Jane Smith",
      plat_no: "B 5678 ABC",
      dock: "3",
      check_labelPort: true,
      check_COA_MSDS: false,
      check_packing_label: true,
    },
    {
      no: 3,
      supplier: "PT. Cahaya Baru",
      dn_number: "DN-2025-003",
      schedule: "10:15",
      driver_name: "Ahmad Susanto",
      plat_no: "B 9012 DEF",
      dock: "1",
      check_labelPort: false,
      check_COA_MSDS: true,
      check_packing_label: true,
    },
  ]);

  // Handler untuk toggle checkbox
  const handleCheckboxChange = (
    rowIndex: number,
    field: "check_labelPort" | "check_COA_MSDS" | "check_packing_label"
  ) => {
    setData((prevData) =>
      prevData.map((item, index) =>
        index === rowIndex
          ? { ...item, [field]: !item[field] }
          : item
      )
    );
  };

  const columns: ColumnConfig[] = [
    {
      key: "no",
      label: "No",
      sortable: true,
    },
    {
      key: "supplier",
      label: "Supplier",
      sortable: true,
    },
    {
      key: "dn_number",
      label: "DN Number",
      sortable: true,
    },
    {
      key: "schedule",
      label: "Schedule",
      sortable: true,
    },
    {
      key: "driver_name",
      label: "Driver Name",
      sortable: true,
    },
    {
      key: "plat_no",
      label: "Plat No",
      sortable: true,
    },
    {
      key: "dock",
      label: "Dock",
      sortable: true,
    },
    {
      key: "check_labelPort",
      label: "Label Port",
      sortable: true,
      render: (value: boolean, row: CheckSheetData, rowIndex: number = 0) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={value}
            onChange={() => handleCheckboxChange(rowIndex, "check_labelPort")}
            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
          />
        </div>
      ),
    },
    {
      key: "check_COA_MSDS",
      label: "COA/MSDS",
      sortable: true,
      render: (value: boolean, row: CheckSheetData, rowIndex: number = 0) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={value}
            onChange={() => handleCheckboxChange(rowIndex, "check_COA_MSDS")}
            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
          />
        </div>
      ),
    },
    {
      key: "check_packing_label",
      label: "Packing Label",
      sortable: true,
      render: (value: boolean, row: CheckSheetData, rowIndex: number = 0) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={value}
            onChange={() => handleCheckboxChange(rowIndex, "check_packing_label")}
            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta
        title="Check Sheet | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Data Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Check Sheet" />
      <div className="space-y-5 sm:space-y-6">
        <DataTableOne
          title="Check Sheet Data"
          data={data}
          columns={columns}
          defaultItemsPerPage={10}
          itemsPerPageOptions={[5, 10, 15, 20]}
          defaultSortKey="no"
          defaultSortOrder="asc"
          searchable={true}
          searchPlaceholder="Search DN numbers, supplier, driver..."
        />
      </div>
    </>
  );
}