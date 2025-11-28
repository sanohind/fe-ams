import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import SearchableSelect from "../../components/form/SearchableSelect";
import SearchableMultiSelect from "../../components/form/SearchableMultiSelect";
import DatePicker from "../../components/form/date-picker";
import { TimeIcon } from "../../icons";
import { useToast } from "../../hooks/useToast";
import apiService from "../../services/api";

interface AddArrivalFormData {
  bp_code: string;
  day_name: 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday';
  arrival_type: 'regular'|'additional';
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
    // Handle YYYY-MM-DD format directly to avoid timezone issues
    const parts = date.split('-');
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
  const [suppliers, setSuppliers] = useState<Array<{value: string; label: string;}>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.getArrivalManageSuppliers();
        if (res.success && res.data) {
          const opts = (res.data as Array<{bp_code:string; bp_name:string}>).map(s => ({ value: s.bp_code, label: `${s.bp_code} - ${s.bp_name}` }));
          setSuppliers(opts);
        }
      } catch {}
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

  const handleCancel = () => {
    navigate("/arrival-manage");
  };

  const supplierOptions = suppliers;

  if (loading) {
    return (
      <>
        <PageMeta title={isEditMode ? "Edit Arrival | SPHERE by SANOH Indonesia" : "Add Arrival | SPHERE by SANOH Indonesia"} description={isEditMode ? "Edit arrival schedule for SPHERE by SANOH Indonesia" : "Add new arrival schedule for SPHERE by SANOH Indonesia"} />
        <PageBreadcrumb pageTitle={isEditMode ? "Edit Arrival" : "Add Arrival"} />
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={isEditMode ? "Edit Arrival | SPHERE by SANOH Indonesia" : "Add Arrival | SPHERE by SANOH Indonesia"} description={isEditMode ? "Edit arrival schedule for SPHERE by SANOH Indonesia" : "Add new arrival schedule for SPHERE by SANOH Indonesia"} />
      <PageBreadcrumb pageTitle={isEditMode ? "Edit Arrival" : "Add Arrival"} />
      
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
              <Input type="time" id="arrival" name="arrival" value={formData.arrival_time}
                onChange={(e) => handleInputChange('arrival_time', e.target.value)} />
              <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400"><TimeIcon className="size-6" /></span>
            </div>
            {errors.arrival_time && <p className="text-xs text-red-500 mt-1">{errors.arrival_time}</p>}
          </div>
          <div>
            <Label>Departure</Label>
            <div className="relative">
              <Input type="time" id="departure" name="departure" value={formData.departure_time || ''}
                onChange={(e) => handleInputChange('departure_time', e.target.value)} />
              <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400"><TimeIcon className="size-6" /></span>
            </div>
          </div>
          <div>
            <Label>Type</Label>
            <div>
              <Select options={typeOptions} placeholder="Select Type" onChange={(val) => handleInputChange('arrival_type', val as any)} className="dark:bg-dark-900" value={formData.arrival_type} />
            </div>
          </div>
          {formData.arrival_type === 'regular' && (
            <div>
              <Label>Day</Label>
              <div>
                <Select options={days} placeholder="Select Day" onChange={(val) => handleInputChange('day_name', val as any)} className="dark:bg-dark-900" value={formData.day_name} />
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
                      // Format date as YYYY-MM-DD in local timezone
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
              {/* Available Arrivals multi-select */}
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
            </div>
          )}
          <div>
            <Label>Dock</Label>
            <div>
              <Select options={dockOptions.map(d => ({ value: d, label: d }))} placeholder="Select Dock" onChange={(val) => handleInputChange('dock', val)} className="dark:bg-dark-900" value={formData.dock || ""} />
            </div>
            {errors.dock && <p className="text-xs text-red-500 mt-1">{errors.dock}</p>}
          </div>
          {/* Button */}
          <div>
            <button disabled={submitting} onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-60">
              {submitting ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
            </button>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
