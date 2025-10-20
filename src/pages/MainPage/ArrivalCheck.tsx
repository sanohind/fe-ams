import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Select from "../../components/form/Select";
import PageMeta from "../../components/common/PageMeta";
import DataTableOne from "../../components/tables/DataTables/TableOne/DataTableOne";
import { ColumnConfig } from "../../components/tables/DataTables/TableOne/DataTableOne";
import SelectInputs from "../../components/form/form-elements/SelectInputs";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import ComponentCard from "../../components/common/ComponentCard";

const options = [
    { value: "marketing", label: "Marketing" },
    { value: "template", label: "Template" },
    { value: "development", label: "Development" },
  ];
  const handleSelectChange = (value: string) => {
    console.log("Selected value:", value);
  };

const dnData = [
    {
        no: 1,
        dnNumber: "DN-2025-001",
        poNumber: "PO-2025-001",
        deliveryDate: "2025-01-01",
        status: "Completed",
    },
    {
        no: 2,
        dnNumber: "DN-2025-002",    
        poNumber: "PO-2025-002",
        deliveryDate: "2025-01-02",
        status: "Completed",
    },
    {
        no: 3,
        dnNumber: "DN-2025-003",
        poNumber: "PO-2025-003",
        deliveryDate: "2025-01-03",
        status: "Completed",
    },
]

const columns: ColumnConfig[] = [
    {
        key: "no",
        label: "No",
        sortable: true,
    },
    {
        key: "dnNumber",
        label: "DN Number",
        sortable: true,
    },
    {
        key: "poNumber",
        label: "PO Number",
        sortable: true,
    },
    {
        key: "deliveryDate",
        label: "Delivery Date",
        sortable: true,
    },
    {
        key: "status",
        label: "Status",
        sortable: true,
    },
]

export default function ArrivalCheck() {
  return (
    <>
      <PageMeta
        title="Arrival Check | SPHERE by SANOH Indonesia"
        description="This is React.js Data Tables Dashboard page for SPHERE by SANOH Indonesia"
      />
      <PageBreadcrumb pageTitle="Arrival Check" />
        <div className="space-y-5 sm:space-y-6">
            <ComponentCard title="Arrival Check">
            <div>
            <Label>Driver name</Label>
            <Select
                options={options}
                placeholder="Select an option"
                onChange={handleSelectChange}
                className="dark:bg-dark-900"
            />
            </div>
            <div>
                <Label>DN Number</Label>
                <Input type="text" id="inputTwo" placeholder="DNXXXXXXX" />
            </div>
            </ComponentCard>
            <DataTableOne   
                title="Arrival Check Results"
                data={dnData}
                columns={columns}
                defaultItemsPerPage={10}
                itemsPerPageOptions={[5, 10, 15, 20]}
                defaultSortKey="no"
                defaultSortOrder="asc"
                searchable={true}
                searchPlaceholder="Search DN numbers..."
            />
        </div>
      
    </>
  );    
}
