import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useDropzone } from "react-dropzone";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import SearchableSelect from "../../components/form/SearchableSelect";
import SearchableMultiSelect from "../../components/form/SearchableMultiSelect";
import { SkeletonAddArrivalForm } from "../../components/ui/skeleton/Skeleton";
import DatePicker from "../../components/form/date-picker";
import Button from "../../components/ui/button/Button";
import { TimeIcon } from "../../icons";
import { useToast } from "../../hooks/useToast";
import apiService from "../../services/api";

interface AddArrivalFormData {
  bp_code: string;
  day_name: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  arrival_type: 'regular' | 'additional';
  arrival_time: string; // HH:mm
  departure_time?: string; // HH:mm
  dock?: string;
  schedule_date?: string; // only for additional
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const COMPLIANCE_LABELS: Record<string, string> = {
  pending: 'Pending',
  on_commitment: 'On Commitment',
  delay: 'Delay',
  no_show: 'No Show',
  partial_delivery: 'Outstanding DN',
  incomplete_qty: 'Incomplete Qty',
};

const formatPlanDeliveryDate = (date?: string | null) => {
  if (!date) return '-';
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  const [year, month, day] = parts;
  const monthIndex = Number(month) - 1;
  const monthLabel = MONTH_NAMES[monthIndex] ?? month;
  return `${day} ${monthLabel} ${year}`;
};

const formatPlanDeliveryDateReadable = (date?: string | null) => {
  if (!date) return '-';
  try {
    // Extract just the date part if it contains time (ISO format: YYYY-MM-DDTHH:mm:ss...)
    const dateOnly = date.includes('T') ? date.split('T')[0] : date;
    
    // Handle YYYY-MM-DD format directly to avoid timezone issues
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const monthIndex = Number(month) - 1;
      const monthLabel = MONTH_NAMES[monthIndex] ?? month;
      return `${day} ${monthLabel} ${year}`;
    }
    
    // Fallback to Date object parsing
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const monthIndex = dateObj.getMonth();
    const monthLabel = MONTH_NAMES[monthIndex] ?? String(monthIndex + 1);
    const year = dateObj.getFullYear();
    return `${day} ${monthLabel} ${year}`;
  } catch {
    return formatPlanDeliveryDate(date);
  }
};

const formatComplianceStatus = (status?: string | null) => {
  if (!status) return '';
  return COMPLIANCE_LABELS[status] ?? status.replace(/_/g, ' ');
};

export default function AddArrival() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const editId = searchParams.get('id') ? parseInt(searchParams.get('id')!) : null;
  const isEditMode = editId !== null;

  const [formData, setFormData] = useState<AddArrivalFormData>({
    bp_code: "",
    day_name: "monday",
    arrival_type: 'regular',
    arrival_time: "08:00",
    departure_time: undefined,
    dock: "",
    schedule_date: undefined,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AddArrivalFormData, string>>>({});
  const [suppliers, setSuppliers] = useState<Array<{ value: string; label: string; }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const loadingRef = useRef(false);
  const [inputMode, setInputMode] = useState<'manual' | 'excel'>('manual');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.getArrivalManageSuppliers();
        if (res.success && res.data) {
          const opts = (res.data as Array<{ bp_code: string; bp_name: string }>).map(s => ({ value: s.bp_code, label: `${s.bp_code} - ${s.bp_name}` }));
          setSuppliers(opts);
        }
      } catch { }
    })();
  }, []);

  // Load data for edit mode - only once when component mounts with editId
  useEffect(() => {
    // Reset flags when switching from edit mode to add mode
    if (!isEditMode || !editId) {
      setDataLoaded(false);
      loadingRef.current = false;
      return;
    }

    // Only load if not already loading and not already loaded for this editId
    if (!loadingRef.current && !dataLoaded) {
      loadingRef.current = true;
      setLoading(true);
      (async () => {
        try {
          const res = await apiService.getArrivalManageList();
          if (res.success && res.data) {
            const schedule = (res.data as any[]).find((item: any) => item.id === editId);
            if (schedule) {
              setFormData({
                bp_code: schedule.bp_code || "",
                day_name: schedule.day_name || "monday",
                arrival_type: schedule.arrival_type || 'regular',
                arrival_time: schedule.arrival_time ? schedule.arrival_time.substring(0, 5) : "08:00", // Extract HH:mm from HH:mm:ss
                departure_time: schedule.departure_time ? schedule.departure_time.substring(0, 5) : undefined,
                dock: schedule.dock || "",
                schedule_date: schedule.schedule_date || undefined,
              });
              setDataLoaded(true);
            } else {
              toast.error('Schedule not found', { title: 'Error' });
              navigate("/arrival-manage");
            }
          }
        } catch (err: any) {
          toast.error(err?.message || 'Failed to load schedule data', { title: 'Error' });
          navigate("/arrival-manage");
        } finally {
          setLoading(false);
          loadingRef.current = false;
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]); // Only depend on editId, not on navigate/toast which can change

  // Load all arrival transactions when form data changes for additional type
  // Skip this effect during initial data load for edit mode
  useEffect(() => {
    // Don't fetch arrival transactions during initial load in edit mode
    if (isEditMode && !dataLoaded) {
      return;
    }

    if (formData.arrival_type === 'additional' && formData.bp_code) {
      (async () => {
        try {
          const res = await apiService.getArrivalManageTransactions({ bp_code: formData.bp_code });
          if (res.success && res.data) {
            const opts = (res.data as any[]).map((a) => {
              const timeLabel = a.plan_delivery_time ? ` ${a.plan_delivery_time.substring(0, 5)}` : '';
              const compliance = formatComplianceStatus(a.delivery_compliance);
              const complianceLabel = compliance ? ` • ${compliance}` : '';
              return {
                value: String(a.id),
                label: `${a.dn_number} • Plan ${formatPlanDeliveryDateReadable(a.plan_delivery_date)}${timeLabel}${complianceLabel}`
              };
            });
            setAvailableArrivalOptions(opts);
          } else {
            setAvailableArrivalOptions([]);
          }
        } catch {
          setAvailableArrivalOptions([]);
        }
      })();
    } else if (formData.arrival_type !== 'additional') {
      setAvailableArrivalOptions([]);
      setSelectedArrivalIds([]);
    }
  }, [formData.arrival_type, formData.bp_code, isEditMode, dataLoaded]);

  const days = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  const typeOptions = [
    { value: 'regular', label: 'Regular' },
    { value: 'additional', label: 'Additional' },
  ];

  const dockOptions = ["1", "2", "3", "4"];
  const [availableArrivalOptions, setAvailableArrivalOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [selectedArrivalIds, setSelectedArrivalIds] = useState<string[]>([]);

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

    if (!formData.bp_code.trim()) {
      newErrors.bp_code = "Supplier is required";
    }

    if (!formData.arrival_time.trim()) {
      newErrors.arrival_time = "Arrival time is required";
    } else {
      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.arrival_time)) {
        newErrors.arrival_time = "Please enter a valid time format (HH:MM)";
      }
    }

    if (formData.arrival_type === 'regular' && !formData.day_name) {
      newErrors.day_name = "Day is required";
    }

    if (!formData.dock) {
      newErrors.dock = "Dock is required";
    }

    if (formData.arrival_type === 'additional' && !formData.schedule_date) {
      newErrors.schedule_date = 'Schedule date is required for additional';
    }
    if (formData.arrival_type === 'additional' && selectedArrivalIds.length === 0) {
      // optional: enforce select at least one
      // newErrors as any
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        setSubmitting(true);
        const payload: any = {
          bp_code: formData.bp_code,
          day_name: formData.day_name,
          arrival_type: formData.arrival_type,
          arrival_time: formData.arrival_time,
          departure_time: formData.departure_time || undefined,
          dock: formData.dock || undefined,
          schedule_date: formData.arrival_type === 'additional' ? formData.schedule_date : undefined,
        };

        // Remove arrival_ids for edit mode (not used in update)
        if (!isEditMode) {
          payload.arrival_ids = formData.arrival_type === 'additional' ? selectedArrivalIds.map(id => Number(id)) : undefined;
        }

        if (isEditMode && editId) {
          // Update existing schedule
          const res = await apiService.updateArrivalSchedule(editId, payload);
          if (res.success) {
            toast.success('Arrival schedule updated successfully!', { title: 'Success' });
            navigate("/arrival-manage");
          } else {
            const errorMsg = res.message || 'Failed to update schedule';
            toast.error(errorMsg, { title: 'Error' });
          }
        } else {
          // Create new schedule
          const res = await apiService.createArrivalSchedule(payload);
          if (res.success) {
            toast.success('Arrival schedule added successfully!', { title: 'Success' });
            navigate("/arrival-manage");
          } else {
            const errorMsg = res.message || 'Failed to create schedule';
            toast.error(errorMsg, { title: 'Error' });
          }
        }
      } catch (err: any) {
        const errorMsg = err?.message || (isEditMode ? 'Failed to update schedule' : 'Failed to create schedule');
        toast.error(errorMsg, { title: 'Error' });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const supplierOptions = suppliers;

  const breadcrumbItems = [
    { label: "Home", path: "/" },
    { label: "Arrival Manage", path: "/arrival-manage" },
    { label: isEditMode ? "Edit Arrival" : "Add Arrival" },
  ];

  // Handle dropzone for Excel upload
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      if (validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        setUploadedFile(file);
      } else {
        toast.error('Please upload a valid Excel file (.xlsx, .xls) or CSV file', { title: 'Invalid File' });
      }
    }
  };

  // Handle Excel file processing
  const handleProcessExcel = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file first', { title: 'No File Selected' });
      return;
    }

    try {
      setSubmitting(true);

      // Send file to backend for processing
      const res = await apiService.importArrivalScheduleFromExcel(uploadedFile);

      if (res.success) {
        const data = res.data as any;
        const importedCount = data?.imported_count || 0;
        const errorCount = data?.error_count || 0;

        toast.success(
          `Successfully imported ${importedCount} schedule(s)${errorCount > 0 ? ` with ${errorCount} error(s)` : ''}!`,
          { title: 'Success' }
        );

        // Reset and redirect after successful upload
        setTimeout(() => {
          navigate("/arrival-manage");
        }, 2000);
      } else {
        const data = res.data as any;
        const errors = data?.errors || [];
        const debug = data?.debug || [];
        let errorMessage = res.message || 'Failed to import file';
        
        if (errors.length > 0) {
          errorMessage = `${errorMessage}\n\nDetails:\n${errors.join('\n')}`;
        }
        
        if (debug.length > 0) {
          errorMessage = `${errorMessage}\n\nDebug Info:\n${debug.join('\n')}`;
        }
        
        toast.error(res.message || 'Failed to import file', { title: 'Error' });
        
        // Also log to console for easier debugging
        console.log('Import Error Details:', { errors, debug });
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to process Excel file';
      toast.error(errorMsg, { title: 'Error' });
    } finally {
      setSubmitting(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    disabled: inputMode !== 'excel',
  });

if (loading) {
  return (
    <>
      <PageMeta title={isEditMode ? "Edit Arrival | SPHERE by SANOH Indonesia" : "Add Arrival | SPHERE by SANOH Indonesia"} description={isEditMode ? "Edit arrival schedule for SPHERE by SANOH Indonesia" : "Add new arrival schedule for SPHERE by SANOH Indonesia"} />
      <PageBreadcrumb pageTitle={isEditMode ? "Edit Arrival" : "Add Arrival"} breadcrumbs={breadcrumbItems} />
      <SkeletonAddArrivalForm />
    </>
  );
}

  return (
    <>
      <PageMeta title={isEditMode ? "Edit Arrival | SPHERE by SANOH Indonesia" : "Add Arrival | SPHERE by SANOH Indonesia"} description={isEditMode ? "Edit arrival schedule for SPHERE by SANOH Indonesia" : "Add new arrival schedule for SPHERE by SANOH Indonesia"} />
      <PageBreadcrumb pageTitle={isEditMode ? "Edit Arrival" : "Add Arrival"} breadcrumbs={breadcrumbItems} />

      <div className="space-y-5 sm:space-y-6">

<ComponentCard title="Input Arrival">
  {/* Tab Selection - Only show in Add mode */}
  {!isEditMode && (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900 mb-6">
      <button
        onClick={() => {
          setInputMode('manual');
          setUploadedFile(null);
        }}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors ${
          inputMode === 'manual'
            ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        Manual Input
      </button>

      <button
        onClick={() => {
          setInputMode('excel');
          setUploadedFile(null);
        }}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors ${
          inputMode === 'excel'
            ? 'shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        Upload Excel
      </button>
    </div>
  )}

  {/* Manual Input Mode */}
  {inputMode === 'manual' && (
    <>
  {/* Grid 2 kolom untuk field-field utama */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
    {/* Kolom Kiri */}
    <div className="space-y-4">
      <div>
        <Label>Supplier</Label>
        <div>
          <SearchableSelect
            options={supplierOptions}
            placeholder="Search supplier by name or code..."
            onChange={(val) => handleInputChange('bp_code', val)}
            className="dark:bg-dark-900"
            value={formData.bp_code}
          />
          {errors.bp_code && <p className="text-xs text-red-500 mt-1">{errors.bp_code}</p>}
        </div>
      </div>

      <div>
        <Label>Arrival</Label>
        <div className="relative">
          <Input 
            type="time" 
            id="arrival" 
            name="arrival" 
            value={formData.arrival_time}
            onChange={(e) => handleInputChange('arrival_time', e.target.value)} 
          />
          <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
            <TimeIcon className="size-6" />
          </span>
        </div>
        {errors.arrival_time && <p className="text-xs text-red-500 mt-1">{errors.arrival_time}</p>}
      </div>

      <div>
        <Label>Departure</Label>
        <div className="relative">
          <Input 
            type="time" 
            id="departure" 
            name="departure" 
            value={formData.departure_time || ''}
            onChange={(e) => handleInputChange('departure_time', e.target.value)} 
          />
          <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
            <TimeIcon className="size-6" />
          </span>
        </div>
      </div>
    </div>

    {/* Kolom Kanan */}
    <div className="space-y-4">
      <div>
        <Label>Type</Label>
        <div>
          <Select 
            options={typeOptions} 
            placeholder="Select Type" 
            onChange={(val) => handleInputChange('arrival_type', val as any)} 
            className="dark:bg-dark-900" 
            value={formData.arrival_type} 
          />
        </div>
      </div>

      {formData.arrival_type === 'regular' && (
        <div>
          <Label>Day</Label>
          <div>
            <Select 
              options={days} 
              placeholder="Select Day" 
              onChange={(val) => handleInputChange('day_name', val as any)} 
              className="dark:bg-dark-900" 
              value={formData.day_name} 
            />
          </div>
          {errors.day_name && <p className="text-xs text-red-500 mt-1">{errors.day_name}</p>}
        </div>
      )}

      {formData.arrival_type === 'additional' && (
        <div>
          <Label>Schedule Date</Label>
          <div>
            <DatePicker
              id="schedule-date-picker"
              mode="single"
              placeholder="Select schedule date"
              defaultDate={formData.schedule_date || undefined}
              onChange={(selectedDates, dateStr) => {
                if (selectedDates && selectedDates.length > 0) {
                  const date = selectedDates[0];
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const formattedDate = `${year}-${month}-${day}`;
                  handleInputChange('schedule_date', formattedDate);
                } else if (dateStr) {
                  handleInputChange('schedule_date', dateStr);
                }
              }}
            />
          </div>
          {errors.schedule_date && <p className="text-xs text-red-500 mt-1">{errors.schedule_date}</p>}
        </div>
      )}

      <div>
        <Label>Dock</Label>
        <div>
          <Select 
            options={dockOptions.map(d => ({ value: d, label: d }))} 
            placeholder="Select Dock" 
            onChange={(val) => handleInputChange('dock', val)} 
            className="dark:bg-dark-900" 
            value={formData.dock || ""} 
          />
        </div>
        {errors.dock && <p className="text-xs text-red-500 mt-1">{errors.dock}</p>}
      </div>
    </div>
  </div>

  {/* DN Selection (Full Width) - hanya untuk additional type */}
  {formData.arrival_type === 'additional' && (
    <div className="mt-4">
      <Label>Select DN to duplicate (optional multiple)</Label>
      {availableArrivalOptions.length > 0 ? (
        <SearchableMultiSelect
          options={availableArrivalOptions}
          placeholder="Search by DN number or select multiple..."
          onChange={(values) => {
            setSelectedArrivalIds(values);
          }}
          value={selectedArrivalIds}
          className="dark:bg-dark-900"
        />
      ) : (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formData.bp_code ? 'No DN found for this supplier.' : 'Please select a supplier to load DNs.'}
        </div>
      )}
    </div>
  )}

  {/* Buttons */}
  <div className="mt-6 flex flex-col sm:flex-row gap-3">
    <Button
      size="sm"
      disabled={submitting}
      onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
      className="w-full sm:w-auto sm:px-8"
    >
      {submitting ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
    </Button>
    <Button
      size="sm"
      variant="outline"
      disabled={submitting}
      onClick={() => navigate("/arrival-manage")}
      className="w-full sm:w-auto sm:px-8"
    >
      Cancel
    </Button>
  </div>
    </>
  )}

  {/* Excel Upload Mode */}
  {inputMode === 'excel' && (
    <div className="space-y-4">
      {/* Information Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <span className="font-semibold">Note:</span> Excel upload is only for adding supplier arrivals with type <span className="font-medium">Regular</span>. For additional arrivals, please use the Manual Input tab.
        </p>
        <div>
          <button
            type="button"
            onClick={() => {
              // Download Excel template from backend
              const apiUrl = import.meta.env.VITE_API_URL || 'http://be-ams.ns1.sanoh.co.id/api';
              const baseUrl = apiUrl.replace('/api', '');
              const link = document.createElement('a');
              link.href = `${baseUrl}/arrival-master-excel-template.xlsx`;
              link.download = 'arrival-master-excel-template.xlsx';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              toast.success('Template downloaded successfully!', { title: 'Success' });
            }}
            className="font-medium underline text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Download template here
          </button>
        </div>
      </div>

      {/* Dropzone */}
      <div className="transition border border-gray-300 border-dashed cursor-pointer dark:hover:border-brand-500 dark:border-gray-700 rounded-xl hover:border-brand-500">
        <form
          {...getRootProps()}
          className={`dropzone rounded-xl border-dashed border-gray-300 p-7 lg:p-10 transition-colors ${
            isDragActive
              ? 'border-brand-500 bg-gray-100 dark:bg-gray-800'
              : 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
          }`}
          id="excel-upload"
        >
          {/* Hidden Input */}
          <input {...getInputProps()} />

          <div className="dz-message flex flex-col items-center m-0!">
            {/* Icon Container */}
            <div className="mb-[22px] flex justify-center">
              <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <svg
                  className="fill-current"
                  width="29"
                  height="28"
                  viewBox="0 0 29 28"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                  />
                </svg>
              </div>
            </div>

            {/* Text Content */}
            <h4 className="mb-3 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
              {isDragActive ? "Drop Excel File Here" : "Drag & Drop Excel File Here"}
            </h4>

            <span className="text-center mb-5 block w-full max-w-[290px] text-sm text-gray-700 dark:text-gray-400">
              Drag and drop your Excel file (.xlsx, .xls) or CSV file here or browse
            </span>

            <span className="font-medium underline text-theme-sm text-brand-500">
              Browse File
            </span>
          </div>
        </form>
      </div>

      {/* Uploaded File Info */}
      {uploadedFile && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">{uploadedFile.name}</p>
                <p className="text-xs text-green-700 dark:text-green-300">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUploadedFile(null)}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Upload Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button
          size="sm"
          disabled={!uploadedFile || submitting}
          onClick={handleProcessExcel}
          className="w-full sm:w-auto sm:px-8"
        >
          {submitting ? 'Processing...' : 'Process Excel'}
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          disabled={submitting}
          onClick={() => navigate("/arrival-manage")}
          className="w-full sm:w-auto sm:px-8"
        >
          Cancel
        </Button>
      </div>
    </div>
  )}
</ComponentCard>
      </div>
    </>
  );
}
