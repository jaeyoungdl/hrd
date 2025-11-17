'use client';

import React from 'react';
import { FilterOptions, ProjectPart, TaskStatus, Project } from '@/types';

interface FilterSectionProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
  onExportCSV: () => void;
  projects?: Project[];
}

export default function FilterSection({ filters, onFilterChange, onExportCSV, projects = [] }: FilterSectionProps) {
  const handleFilterToggle = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters };
    if (newFilters[key] === value) {
      delete newFilters[key];
    } else {
      (newFilters as any)[key] = value;
    }
    onFilterChange(newFilters);
  };

  const handleClearAll = () => {
    onFilterChange({});
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== undefined).length;
  };

  const taskStatuses: TaskStatus[] = ['대기', '진행중', '완료', '보류'];
  const projectParts: ProjectPart[] = ['frontend', 'backend', 'designer', '기획', 'app', 'ai'];
  
  // 프로젝트들의 월 범위를 기반으로 월 목록 생성
  const generateMonthRange = (projects: Project[]): string[] => {
    if (projects.length === 0) {
      // 프로젝트가 없으면 기본적으로 현재 년도 기준으로 6개월
      const currentDate = new Date();
      const months = [];
      for (let i = -3; i <= 3; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
        months.push(date.toISOString().slice(0, 7));
      }
      return months;
    }

    const allMonths = new Set<string>();
    
    projects.forEach(project => {
      const startDate = new Date(project.startMonth + '-01');
      const endDate = new Date(project.endMonth + '-01');
      
      const current = new Date(startDate);
      while (current <= endDate) {
        allMonths.add(current.toISOString().slice(0, 7));
        current.setMonth(current.getMonth() + 1);
      }
    });

    return Array.from(allMonths).sort();
  };

  const months = generateMonthRange(projects);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      {/* 필터 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            <span className="font-medium">필터</span>
            {getActiveFilterCount() > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </div>
          
          {getActiveFilterCount() > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>초기화</span>
            </button>
          )}
        </div>
      </div>

      {/* 필터 옵션들 - 1열로 배치 */}
      <div className="flex flex-wrap gap-8">
        {/* 파트 필터 */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-semibold text-gray-800 uppercase tracking-wide">파트</label>
          <div className="flex gap-2">
            {projectParts.map(part => (
              <button
                key={part}
                onClick={() => handleFilterToggle('part', part)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                  filters.part === part
                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-400 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                {part === 'frontend' ? 'Frontend' : 
                 part === 'backend' ? 'Backend' : 
                 part === 'designer' ? 'Design' : part}
              </button>
            ))}
          </div>
        </div>

        {/* 월 필터 */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-semibold text-gray-800 uppercase tracking-wide">월</label>
          <select
            value={filters.month || ''}
            onChange={(e) => {
              if (e.target.value) {
                handleFilterToggle('month', e.target.value);
              } else {
                const newFilters = { ...filters };
                delete newFilters.month;
                onFilterChange(newFilters);
              }
            }}
            className="px-4 py-2 text-sm font-medium text-gray-800 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:border-purple-400 transition-all duration-200 min-w-[120px]"
          >
            <option value="" className="text-gray-600">전체</option>
            {months.map(month => (
              <option key={month} value={month} className="text-gray-800">
                {month}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}