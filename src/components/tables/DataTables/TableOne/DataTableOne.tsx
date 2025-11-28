"use client";

import { useState, useMemo, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../ui/table";
import DatePicker from "../../../form/date-picker";
import PaginationWithIcon from "./PaginationWithIcon";

export interface ColumnConfig {
  key: string;
  label: ReactNode;
  sortable?: boolean;
  render?: (value: any, row: any, rowIndex?: number) => React.ReactNode;
}

interface DataTableOneProps {
  data: any[];
  columns: ColumnConfig[];
  title?: string;
  defaultItemsPerPage?: number;
  itemsPerPageOptions?: number[];
  defaultSortKey?: string;
  defaultSortOrder?: "asc" | "desc";
  searchable?: boolean;
  searchPlaceholder?: string;
  datePicker?: boolean;
  onDateChange?: (selectedDates: Date[], dateStr: string) => void;
  emptyStateMessage?: string;
}

type SortOrder = "asc" | "desc";

export default function DataTableOne({
  data,
  columns,
  title,
  defaultItemsPerPage = 10,
  itemsPerPageOptions = [5, 8, 10],
  defaultSortKey = "",
  defaultSortOrder = "asc",
  searchable = true,
  searchPlaceholder = "Search...",
  datePicker = false,
  onDateChange,
  emptyStateMessage = "No data available",
}: DataTableOneProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [sortKey, setSortKey] = useState<string>(
    defaultSortKey || columns[0]?.key || ""
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);
  const [searchTerm, setSearchTerm] = useState("");

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((value, key) => value?.[key], obj);
  };

  const filteredAndSortedData = useMemo(() => {
    return data
      .filter((item) => {
        if (!searchable || !searchTerm) return true;

        return columns.some((col) => {
          const value = getNestedValue(item, col.key);
          return (
            value &&
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          );
        });
      })
      .sort((a, b) => {
        const column = columns.find((col) => col.key === sortKey);
        if (!column?.sortable) return 0;

        const aValue = getNestedValue(a, sortKey);
        const bValue = getNestedValue(b, sortKey);

        // Handle numeric values (including currency)
        const aNum =
          typeof aValue === "string"
            ? Number(aValue.replace(/[^0-9.-]/g, ""))
            : aValue;
        const bNum =
          typeof bValue === "string"
            ? Number(bValue.replace(/[^0-9.-]/g, ""))
            : bValue;

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
        }

        // Handle string comparison
        const aStr = String(aValue || "");
        const bStr = String(bValue || "");

        return sortOrder === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
  }, [data, columns, sortKey, sortOrder, searchTerm, searchable]);

  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (key: string) => {
    const column = columns.find((col) => col.key === key);
    if (!column?.sortable) return;

    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentData = filteredAndSortedData.slice(startIndex, endIndex);

  return (
    <div className="overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl">
      {title && (
        <div className="px-4 py-4 border-b border-gray-100 dark:border-white/[0.05]">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}
      <div className="flex flex-col gap-2 px-4 py-4 border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-gray-500 dark:text-gray-400"> Show </span>
          <div className="relative z-20 bg-transparent">
            <select
              className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              {itemsPerPageOptions.map((value) => (
                <option
                  key={value}
                  value={value}
                  className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                >
                  {value}
                </option>
              ))}
            </select>
            <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
              <svg
                className="stroke-current"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                  stroke=""
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
          <span className="text-gray-500 dark:text-gray-400"> entries </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {datePicker && (
            <div className="w-full sm:w-auto">
              <DatePicker
                id="table-date-picker"
                mode="range"
                placeholder="Select date range"
                onChange={onDateChange}
              />
            </div>
          )}

          {searchable && (
            <div className="relative">
              <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none left-4 top-1/2 dark:text-gray-400">
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                    fill=""
                  />
                </svg>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
              />
            </div>
          )}
        </div>
      </div>

      <div className="w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-max">
          <Table>
            <TableHeader className="border-t border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    isHeader
                    className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                  >
                    <div
                      className={`flex items-center justify-between ${
                        column.sortable !== false ? "cursor-pointer" : ""
                      }`}
                      onClick={() =>
                        column.sortable !== false && handleSort(column.key)
                      }
                    >
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        {column.label}
                      </p>
                      {column.sortable !== false && (
                        <button className="flex flex-col gap-0.5">
                          <svg
                            className={`text-gray-300 dark:text-gray-700  ${
                              sortKey === column.key && sortOrder === "asc"
                                ? "text-brand-500"
                                : ""
                            }`}
                            width="8"
                            height="5"
                            viewBox="0 0 8 5"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z"
                              fill="currentColor"
                            />
                          </svg>
                          <svg
                            className={`text-gray-300 dark:text-gray-700  ${
                              sortKey === column.key && sortOrder === "desc"
                                ? "text-brand-500"
                                : ""
                            }`}
                            width="8"
                            height="5"
                            viewBox="0 0 8 5"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 border border-gray-100 dark:border-white/[0.05] text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 mb-3 text-gray-400 dark:text-gray-600 mx-auto">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">
                        {searchTerm ? "No results found" : "No data available"}
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md">
                        {searchTerm
                          ? `No data matching "${searchTerm}"`
                          : emptyStateMessage}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentData.map((item, i) => (
                  <TableRow key={i}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className="px-4 py-3 border border-gray-100 dark:border-white/[0.05] whitespace-nowrap"
                      >
                        {column.render ? (
                          column.render(
                            getNestedValue(item, column.key),
                            item,
                            startIndex + i
                          )
                        ) : (
                          <span className="font-normal dark:text-gray-400/90 text-gray-800 text-theme-sm">
                            {getNestedValue(item, column.key)}
                          </span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
          <div className="pb-3 xl:pb-0">
            <p className="pb-3 text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
              Showing {startIndex + 1} to {endIndex} of {totalItems} entries
            </p>
          </div>
          <PaginationWithIcon
            totalPages={totalPages}
            initialPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
