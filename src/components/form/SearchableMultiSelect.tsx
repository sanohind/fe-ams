import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SearchableMultiSelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (values: string[]) => void;
  className?: string;
  defaultValue?: string[];
  value?: string[];
}

const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  options,
  placeholder = "Search or select...",
  onChange,
  className = "",
  defaultValue = [],
  value,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>(value || defaultValue || []);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Update selected values when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValues(value);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));

  const handleToggle = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue];
    
    setSelectedValues(newValues);
    onChange(newValues);
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValues = selectedValues.filter((v) => v !== optionValue);
    setSelectedValues(newValues);
    onChange(newValues);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`min-h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs text-left focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${
          selectedValues.length > 0
            ? "text-gray-800 dark:text-white/90"
            : "text-gray-400 dark:text-gray-400"
        }`}
      >
        {selectedValues.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedOptions.slice(0, 2).map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 rounded bg-brand-100 px-2 py-0.5 text-xs text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
              >
                {opt.label.length > 30 ? `${opt.label.substring(0, 30)}...` : opt.label}
                <button
                  type="button"
                  onClick={(e) => handleRemove(opt.value, e)}
                  className="hover:text-brand-900 dark:hover:text-brand-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {selectedValues.length > 2 && (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                +{selectedValues.length - 2} more
              </span>
            )}
          </div>
        ) : (
          <span>{placeholder}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by DN number..."
              className="h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1.5 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              autoFocus
            />
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 ${
                      isSelected
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                      readOnly
                    />
                    <span className="flex-1">{option.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableMultiSelect;

