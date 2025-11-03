import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Save, X } from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import SearchableSelect from "../../components/form/SearchableSelect";
import { TimeIcon } from "../../icons";
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

export default function AddArrival() {
  const navigate = useNavigate();
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
  const [availableArrivalOptions, setAvailableArrivalOptions] = useState<Array<{ value: number; label: string }>>([]);
  const [selectedArrivalIds, setSelectedArrivalIds] = useState<number[]>([]);

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

    // Auto-load available arrivals when additional type and schedule_date changes
    if ((field === 'schedule_date' || field === 'bp_code' || field === 'arrival_type') && (field === 'arrival_type' ? value === 'additional' : formData.arrival_type === 'additional')) {
      const date = field === 'schedule_date' ? value : formData.schedule_date;
      const type = field === 'arrival_type' ? (value as any) : formData.arrival_type;
      const bp = field === 'bp_code' ? value : formData.bp_code;
      if (type === 'additional' && date) {
        (async () => {
          try {
            const res = await apiService.getArrivalManageAvailableArrivals({ date, bp_code: bp || undefined });
            if (res.success && res.data) {
              const opts = (res.data as any[]).map((a) => ({
                value: a.id as number,
                label: `${a.dn_number} (${a.plan_delivery_time ?? ''})`
              }));
              setAvailableArrivalOptions(opts);
            } else {
              setAvailableArrivalOptions([]);
            }
          } catch {
            setAvailableArrivalOptions([]);
          }
        })();
      }
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
          arrival_ids: formData.arrival_type === 'additional' ? selectedArrivalIds : undefined,
        };
        const res = await apiService.createArrivalSchedule(payload);
        if (res.success) {
          alert("Arrival schedule added successfully!");
          navigate("/arrival-manage");
        } else {
          alert(res.message || 'Failed to create schedule');
        }
      } catch (err: any) {
        alert(err?.message || 'Failed to create schedule');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleCancel = () => {
    navigate("/arrival-manage");
  };

  const supplierOptions = suppliers;

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
              <Select options={typeOptions} placeholder="Select Type" onChange={(val) => handleInputChange('arrival_type', val as any)} className="dark:bg-dark-900" />
            </div>
          </div>
          {formData.arrival_type === 'regular' && (
            <div>
              <Label>Day</Label>
              <div>
                <Select options={days} placeholder="Select Day" onChange={(val) => handleInputChange('day_name', val as any)} className="dark:bg-dark-900" />
              </div>
              {errors.day_name && <p className="text-xs text-red-500 mt-1">{errors.day_name}</p>}
            </div>
          )}
          {formData.arrival_type === 'additional' && (
            <div>
              <Label>Schedule Date</Label>
              <div>
                <Input type="date" value={formData.schedule_date || ''} onChange={(e) => handleInputChange('schedule_date', e.target.value)} />
              </div>
              {errors.schedule_date && <p className="text-xs text-red-500 mt-1">{errors.schedule_date}</p>}
              {/* Available Arrivals multi-select */}
              <div className="mt-4">
                <Label>Select DN to duplicate (optional multiple)</Label>
                <Select
                  options={availableArrivalOptions.map(o => ({ value: String(o.value), label: o.label }))}
                  placeholder="Select DN(s)"
                  onChange={(val) => {
                    // When Select supports multi, replace by MultiSelect if available
                    const parsed = Array.isArray(val) ? val : [val];
                    const ids = parsed.map((v: string) => Number(v));
                    setSelectedArrivalIds(ids);
                  }}
                  className="dark:bg-dark-900"
                />
              </div>
            </div>
          )}
          <div>
            <Label>Dock</Label>
            <div>
              <Select options={dockOptions.map(d => ({ value: d, label: d }))} placeholder="Select Dock" onChange={(val) => handleInputChange('dock', val)} className="dark:bg-dark-900" />
            </div>
            {errors.dock && <p className="text-xs text-red-500 mt-1">{errors.dock}</p>}
          </div>
          {/* Button */}
          <div>
            <button disabled={submitting} onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-60">
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
