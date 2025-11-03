import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne from "../../components/tables/DataTables/TableOne/DataTableOne";
import { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import apiService from "../../services/api";

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
  arrival_id: number;
}

export default function CheckSheet() {
  const [data, setData] = useState<CheckSheetData[]>([]);
  const [selectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getCheckSheetList(selectedDate);
      if (res.success) {
        const arrivals = (res.data.arrivals || []) as any[];
        const rows: CheckSheetData[] = [];
        let counter = 1;
        arrivals.forEach((g: any) => {
          (g.rows || []).forEach((r: any) => {
            rows.push({
              no: counter++,
              supplier: r.supplier_name || '-',
              dn_number: r.dn_number,
              schedule: r.schedule || '-',
              driver_name: r.driver_name || '-',
              plat_no: r.vehicle_plate || '-',
              dock: r.dock || '-',
              check_labelPort: r.label_part_status === 'OK',
              check_COA_MSDS: r.coa_msds_status === 'OK',
              check_packing_label: r.packing_condition_status === 'OK',
              arrival_id: r.arrival_id,
            });
          });
        });
        setData(rows);
      } else {
        setError(res.message || 'Failed to fetch data');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Handler untuk toggle checkbox (simpan ke backend)
  const handleCheckboxChange = async (
    rowIndex: number,
    field: "check_labelPort" | "check_COA_MSDS" | "check_packing_label"
  ) => {
    const row = data[rowIndex];
    if (!row) return;

    const nextValue = !row[field];
    // Map field to API keys
    const payloadMap: any = {
      check_labelPort: 'label_part',
      check_COA_MSDS: 'coa_msds',
      check_packing_label: 'packing_condition',
    };

    const body = {
      arrival_id: row.arrival_id,
      dn_number: row.dn_number,
      check_sheet_data: {
        label_part: (field === 'check_labelPort' ? nextValue : row.check_labelPort) ? 'OK' : 'NOT_OK',
        coa_msds: (field === 'check_COA_MSDS' ? nextValue : row.check_COA_MSDS) ? 'OK' : 'NOT_OK',
        packing_condition: (field === 'check_packing_label' ? nextValue : row.check_packing_label) ? 'OK' : 'NOT_OK',
      },
    } as const;

    try {
      await apiService.submitCheckSheet(body as any);
      // Update UI state
      setData((prev) => prev.map((item, idx) => idx === rowIndex ? { ...item, [field]: nextValue } : item));
    } catch (e) {
      // ignore for now
    }
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
        title="Check Sheet | SPHERE by SANOH Indonesia"
        description="This is React.js Check Sheet page for SPHERE by SANOH Indonesia"
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