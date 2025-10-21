import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Save, X } from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { TimeIcon } from "../../icons";

interface AddArrivalFormData {
  supplier: string;
  schedule: string;
  day: string;
  dock: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
}

export default function AddArrival() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AddArrivalFormData>({
    supplier: "",
    schedule: "",
    day: "",
    dock: "",
    frequency: "weekly",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AddArrivalFormData, string>>>({});

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const frequencyOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Bi-weekly" },
    { value: "monthly", label: "Monthly" },
  ];

  const dockOptions = ["A-01", "A-02", "A-03", "A-04", "A-05", "B-01", "B-02", "B-03", "B-04", "B-05", "C-01", "C-02", "C-03", "C-04", "C-05"];

  const handleInputChange = (field: keyof AddArrivalFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AddArrivalFormData, string>> = {};

    if (!formData.supplier.trim()) {
      newErrors.supplier = "Supplier is required";
    }

    if (!formData.schedule.trim()) {
      newErrors.schedule = "Schedule is required";
    } else {
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.schedule)) {
        newErrors.schedule = "Please enter a valid time format (HH:MM)";
      }
    }

    if (!formData.day) {
      newErrors.day = "Day is required";
    }

    if (!formData.dock) {
      newErrors.dock = "Dock is required";
    }

    if (!formData.frequency) {
      newErrors.frequency = "Frequency is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Here you would typically save the data to your backend
      console.log("Form submitted:", formData);

      // Show success message and navigate back
      alert("Arrival schedule added successfully!");
      navigate("/arrival-manage");
    }
  };

  const handleCancel = () => {
    navigate("/arrival-manage");
  };

  const options = [
    { value: "marketing", label: "Marketing" },
    { value: "template", label: "Template" },
    { value: "development", label: "Development" },
  ];
  const handleSelectChange = (value: string) => {
    console.log("Selected value:", value);
  };
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  return (
    <>
      <PageMeta title="Add Arrival | SPHERE by SANOH Indonesia" description="Add new arrival schedule for SPHERE by SANOH Indonesia" />
      <PageBreadcrumb pageTitle="Add Arrival" />
      
      <div className="space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={handleCancel} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Arrival Management
          </button>
        </div>

        <ComponentCard title="Input Arrival">
          <div>
              <Label>Supplier</Label>
              <div>
              <Select
                options={options}
                placeholder="Select Supplier"
                onChange={handleSelectChange}
                className="dark:bg-dark-900"
              />
              </div>
          </div>
          <div>
              <Label>Arrival</Label>
              <div className="relative">
              <Input
                type="time"
                id="arrival"
                name="arrival"
                onChange={(e) => console.log(e.target.value)}
              />
              <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                <TimeIcon className="size-6" />
              </span>
              </div>
          </div>
          <div>
              <Label>Departure</Label>
              <div className="relative">
              <Input
                type="time"
                id="departure"
                name="departure"
                onChange={(e) => console.log(e.target.value)}
              />
              <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                <TimeIcon className="size-6" />
              </span>
              </div>
          </div>
          <div>
              <Label>Day</Label>
              <div>
              <Select
                options={options}
                placeholder="Select Day"
                onChange={handleSelectChange}
                className="dark:bg-dark-900"
              />
              </div>
          </div>
          <div>
              <Label>Dock</Label>
              <div>
              <Select
                options={options}
                placeholder="Select Dock"
                onChange={handleSelectChange}
                className="dark:bg-dark-900"
              />
              </div>
          </div>
          <div>
              <Label>Frequency</Label>
              <div>
              <Select
                options={options}
                placeholder="Select Frequency"
                onChange={handleSelectChange}
                className="dark:bg-dark-900"
              />
              </div>
          </div>
          {/* Button */}
          <div>
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors">
                  Save
              </button>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
