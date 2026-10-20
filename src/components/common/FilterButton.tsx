import React from 'react';
import { Filter } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterButtonProps {
  label: string;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  className?: string;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
  className = '',
}) => {
  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <label htmlFor={`filter-${label}`} className="text-xs font-medium text-slate-400 hidden sm:inline">
        {label}:
      </label>
      <div className="relative">
        <select
          id={`filter-${label}`}
          value={selectedValue}
          onChange={(e) => onSelect(e.target.value)}
          className="appearance-none rounded-lg border border-slate-700 bg-slate-800/90 py-2 pl-3 pr-8 text-xs font-medium text-slate-200 hover:border-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
          <Filter className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
};
