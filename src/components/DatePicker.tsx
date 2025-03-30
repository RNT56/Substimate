import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  min,
  max = new Date().toISOString().split('T')[0],
  required = false,
  disabled = false,
  className = ''
}: DatePickerProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      return new Date(value);
    }
    return new Date();
  });
  
  const [viewedMonth, setViewedMonth] = useState(currentDate.getMonth());
  const [viewedYear, setViewedYear] = useState(currentDate.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  
  const datePickerRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const yearScrollRef = useRef<HTMLDivElement>(null);
  
  // Format date for display
  const formattedDate = new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowMonthPicker(false);
        setShowYearPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Scroll to current month/year when pickers open
  useEffect(() => {
    if (showMonthPicker && monthScrollRef.current) {
      const selectedMonthElement = monthScrollRef.current.querySelector(`[data-month="${viewedMonth}"]`);
      if (selectedMonthElement) {
        selectedMonthElement.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [showMonthPicker, viewedMonth]);
  
  useEffect(() => {
    if (showYearPicker && yearScrollRef.current) {
      const selectedYearElement = yearScrollRef.current.querySelector(`[data-year="${viewedYear}"]`);
      if (selectedYearElement) {
        selectedYearElement.scrollIntoView({ block: 'center', behavior: 'auto' });
      }
    }
  }, [showYearPicker, viewedYear]);
  
  // Generate month and year ranges
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentYear = new Date().getFullYear();
  const startYear = 1979;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
  
  // Handle date selection
  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewedYear, viewedMonth, day);
    
    if (min && new Date(min) > newDate) return;
    if (max && new Date(max) < newDate) return;
    
    setCurrentDate(newDate);
    onChange(newDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };
  
  const handleMonthSelect = (monthIndex: number) => {
    setViewedMonth(monthIndex);
    setShowMonthPicker(false);
  };
  
  const handleYearSelect = (year: number) => {
    setViewedYear(year);
    setShowYearPicker(false);
  };
  
  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get first day of the month (0-6, Sunday to Saturday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Generate calendar grid
  const daysInMonth = getDaysInMonth(viewedYear, viewedMonth);
  const firstDayOfMonth = getFirstDayOfMonth(viewedYear, viewedMonth);
  
  const days = [];
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  // Fill empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Fill cells with days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  const isSelectedDay = (day: number) => {
    return (
      currentDate.getDate() === day &&
      currentDate.getMonth() === viewedMonth &&
      currentDate.getFullYear() === viewedYear
    );
  };
  
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewedMonth &&
      today.getFullYear() === viewedYear
    );
  };
  
  const isDisabledDay = (day: number) => {
    const date = new Date(viewedYear, viewedMonth, day);
    
    if (min && new Date(min) > date) return true;
    if (max && new Date(max) < date) return true;
    
    return false;
  };
  
  const isDarkMode = theme === 'dark';
  
  // Add overlay click handler to close pickers
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (showMonthPicker || showYearPicker) {
      e.stopPropagation();
      setShowMonthPicker(false);
      setShowYearPicker(false);
    }
  };
  
  return (
    <div className="relative" ref={datePickerRef}>
      <div className="relative">
        <input
          type="text"
          readOnly
          value={formattedDate}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full neumorphic-input rounded-lg pl-10 pr-4 py-3 text-theme-primary focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          required={required}
          disabled={disabled}
        />
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-secondary" size={16} />
      </div>
      
      {isOpen && !disabled && (
        <div 
          className={`absolute z-50 mt-2 w-[320px] right-0 neumorphic-card rounded-lg overflow-hidden ${isDarkMode ? 'bg-[#2d2d2d]' : 'bg-white'} shadow-lg`}
          onClick={handleOverlayClick}
        >
          <div className="p-4">
            {/* Header with month and year selectors */}
            <div className="flex justify-between mb-4 relative">
              <div 
                className="flex items-center cursor-pointer hover:text-theme-primary relative"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMonthPicker(!showMonthPicker);
                  setShowYearPicker(false);
                }}
              >
                <span className="font-semibold">{months[viewedMonth]}</span>
                <ChevronDown className="h-4 w-4 ml-1" />
                
                {/* Month Picker - positioned directly below */}
                {showMonthPicker && (
                  <div 
                    className="absolute top-full left-0 w-40 mt-1 overflow-auto custom-scrollbar snap-y z-10 rounded-lg"
                    style={{ 
                      backgroundColor: isDarkMode ? 'rgba(45, 45, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      height: '200px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    ref={monthScrollRef}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {months.map((month, index) => (
                      <div
                        key={month}
                        data-month={index}
                        className={`p-3 text-center snap-center cursor-pointer ${
                          viewedMonth === index 
                            ? isDarkMode 
                              ? 'bg-[#404040] font-semibold highlight-color'
                              : 'bg-emerald-100 text-emerald-700 font-semibold'
                            : isDarkMode
                              ? 'hover:bg-gray-700/20'
                              : 'hover:bg-gray-100'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMonthSelect(index);
                        }}
                      >
                        {month}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div 
                className="flex items-center cursor-pointer hover:text-theme-primary relative"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowYearPicker(!showYearPicker);
                  setShowMonthPicker(false);
                }}
              >
                <span className="font-semibold">{viewedYear}</span>
                <ChevronDown className="h-4 w-4 ml-1" />
                
                {/* Year Picker - positioned directly below */}
                {showYearPicker && (
                  <div 
                    className="absolute top-full right-0 w-32 mt-1 overflow-auto custom-scrollbar snap-y z-10 rounded-lg"
                    style={{ 
                      backgroundColor: isDarkMode ? 'rgba(45, 45, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      height: '200px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    ref={yearScrollRef}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {years.map((year) => (
                      <div
                        key={year}
                        data-year={year}
                        className={`p-3 text-center snap-center cursor-pointer ${
                          viewedYear === year 
                            ? isDarkMode
                              ? 'bg-[#404040] font-semibold highlight-color'
                              : 'bg-emerald-100 text-emerald-700 font-semibold'
                            : isDarkMode
                              ? 'hover:bg-gray-700/20'
                              : 'hover:bg-gray-100'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleYearSelect(year);
                        }}
                      >
                        {year}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Days of the week */}
            <div className="grid grid-cols-7 gap-2 text-center mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className={`text-sm font-semibold ${isDarkMode ? 'text-theme-secondary' : 'text-gray-600'}`}>
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`
                    h-9 w-9 mx-auto flex items-center justify-center rounded-full text-sm font-medium
                    ${day === null ? 'invisible' : 'cursor-pointer'}
                    ${isDisabledDay(day as number) 
                      ? isDarkMode ? 'text-theme-tertiary cursor-not-allowed' : 'text-gray-300 cursor-not-allowed' 
                      : isDarkMode ? 'text-theme-primary' : 'text-gray-700'}
                    ${isSelectedDay(day as number) 
                      ? 'bg-emerald-500 text-white font-semibold shadow-sm' 
                      : ''}
                    ${isToday(day as number) && !isSelectedDay(day as number) 
                      ? isDarkMode 
                        ? 'border border-highlight text-highlight font-semibold' 
                        : 'border-2 border-emerald-500 text-emerald-600 font-semibold' 
                      : ''}
                    ${!isDisabledDay(day as number) && !isSelectedDay(day as number) && !isToday(day as number) 
                      ? isDarkMode 
                        ? 'hover:bg-gray-700/20' 
                        : 'hover:bg-emerald-50 hover:text-emerald-600' 
                      : ''}
                  `}
                  onClick={() => day !== null && !isDisabledDay(day) && handleDateSelect(day)}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 