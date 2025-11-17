'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/types';

interface WeeklyReportData {
  period: string;
  projects: any[];
  completedTasks: any[];
  inProgressTasks: any[];
  upcomingTasks: any[];
  weeklyReport: string;
  summary: {
    totalCompleted: number;
    totalInProgress: number;
    totalUpcoming: number;
    totalProjects: number;
  };
}

interface WeeklyReportPageProps {
  currentUserId?: number;
}

export default function WeeklyReportPage({ currentUserId }: WeeklyReportPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<WeeklyReportData[]>([]);
  const [error, setError] = useState('');

  // 프로젝트 목록 로드 (본인이 참여하는 프로젝트만)
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const result = await response.json();
        if (result.success) {
          // 본인이 참여하는 프로젝트만 필터링
          const userProjects = result.data.filter((project: any) => {
            if (!currentUserId) return false;
            
            // 프로젝트 멤버 목록에서 현재 사용자 ID가 있는지 확인
            const allMembers = [
              ...(project.frontendMembers || []),
              ...(project.backendMembers || []),
              ...(project.designerMembers || []),
              ...(project.uxMembers || []),
              ...(project.appMembers || []),
              ...(project.aiMembers || []),
              project.pmId
            ];
            
            return allMembers.includes(currentUserId);
          });
          
          setProjects(userProjects);
        }
      } catch (error) {
        console.error('프로젝트 로드 에러:', error);
      }
    };
    fetchProjects();
  }, [currentUserId]);

  const handleProjectToggle = (projectId: number) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const selectAllProjects = () => {
    setSelectedProjects(projects.map(p => p.id));
  };

  const deselectAllProjects = () => {
    setSelectedProjects([]);
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('시작일과 종료일을 모두 입력해주세요.');
      return;
    }

    if (selectedProjects.length === 0) {
      setError('최소 하나의 프로젝트를 선택해주세요.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('시작일은 종료일보다 이전이어야 합니다.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/weekly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          projectIds: selectedProjects,
          currentUserId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setReportData([result.data]);
      } else {
        setError(result.error || '통합 주간회의록 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('통합 주간회의록 생성 에러:', error);
      setError('통합 주간회의록 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (reportData.length > 0) {
      const report = reportData[0].weeklyReport;
      navigator.clipboard.writeText(report);
      alert('통합 주간회의록이 클립보드에 복사되었습니다!');
    }
  };

  const downloadReport = () => {
    if (reportData.length > 0) {
      const report = reportData[0].weeklyReport;
      const blob = new Blob([report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `통합_주간회의록_${startDate}_${endDate}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const createNotionPage = async () => {
    if (reportData.length === 0) return;

    try {
      const report = reportData[0].weeklyReport;
      const title = `주간회의록 ${startDate} ~ ${endDate}`;
      
      const response = await fetch('/api/notion/create-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: report,
          title: title
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`노션 페이지가 생성되었습니다!\n제목: ${result.data.title}\nURL: ${result.data.url}`);
        // 새 탭에서 노션 페이지 열기
        window.open(result.data.url, '_blank');
      } else {
        alert(`노션 페이지 생성 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('노션 페이지 생성 에러:', error);
      alert('노션 페이지 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          주간회의록 작성
        </h2>
        <p className="text-gray-600">선택한 프로젝트들의 주간회의록을 AI로 자동 생성합니다.</p>
      </div>

      {!reportData.length ? (
        <div className="space-y-6">
          {/* 기간 선택 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 기간 선택</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작일
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료일
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-900"
                />
              </div>
            </div>
          </div>

          {/* 프로젝트 선택 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📋 프로젝트 선택</h3>
              <div className="space-x-2">
                <button
                  onClick={selectAllProjects}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  전체 선택
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={deselectAllProjects}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  전체 해제
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {projects.map((project) => (
                <label
                  key={project.id}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedProjects.includes(project.id)
                      ? 'bg-purple-50 border-purple-200 text-purple-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedProjects.includes(project.id)}
                    onChange={() => handleProjectToggle(project.id)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                    selectedProjects.includes(project.id)
                      ? 'bg-purple-500 border-purple-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedProjects.includes(project.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{project.name}</div>
                    <div className="text-xs text-gray-500 truncate">{project.description}</div>
                  </div>
                </label>
              ))}
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              선택된 프로젝트: <span className="font-medium text-purple-600">{selectedProjects.length}</span>개
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 생성 버튼 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 px-6 rounded-md font-medium text-lg hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  주간회의록 생성 중... ({selectedProjects.length}개 프로젝트)
                </div>
              ) : (
                `📝 ${selectedProjects.length}개 프로젝트 주간회의록 생성하기`
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 요약 정보 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 생성 완료</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {reportData[0]?.summary.totalCompleted || 0}
                </div>
                <div className="text-sm text-gray-600">완료된 작업</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {reportData[0]?.summary.totalInProgress || 0}
                </div>
                <div className="text-sm text-gray-600">진행중 작업</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {reportData[0]?.summary.totalUpcoming || 0}
                </div>
                <div className="text-sm text-gray-600">예정된 작업</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {reportData[0]?.summary.totalProjects || 0}
                </div>
                <div className="text-sm text-gray-600">포함된 프로젝트</div>
              </div>
            </div>
          </div>


          {/* 액션 버튼들 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={copyToClipboard}
                className="bg-blue-500 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                📋 복사
              </button>
              <button
                onClick={downloadReport}
                className="bg-green-500 text-white py-3 px-4 rounded-md font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                💾 다운로드
              </button>
              <button
                onClick={createNotionPage}
                className="bg-purple-500 text-white py-3 px-4 rounded-md font-medium hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              >
                📝 노션에 추가
              </button>
              <button
                onClick={() => setReportData([])}
                className="bg-gray-500 text-white py-3 px-4 rounded-md font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                🔄 다시 생성
              </button>
            </div>
          </div>

          {/* 생성된 통합 회의록 */}
          {reportData.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">통합 주간회의록 - {reportData[0].period}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {reportData[0].projects.map(p => p.name).join(', ')} 프로젝트 포함
                </p>
              </div>
              <div className="p-6">
                <div 
                  className="prose prose-sm max-w-none text-black"
                  dangerouslySetInnerHTML={{ 
                    __html: reportData[0].weeklyReport
                      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-black mb-4">$1</h1>')
                      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-black mb-3 mt-6">$1</h2>')
                      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium text-black mb-2 mt-4">$1</h3>')
                      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-black">$1</strong>')
                      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1 text-black">$1</li>')
                      .replace(/^    - (.*$)/gim, '<li class="ml-8 mb-1 text-black">$1</li>')
                      .replace(/^        - (.*$)/gim, '<li class="ml-12 mb-1 text-black">$1</li>')
                      .replace(/^---$/gim, '<hr class="my-6 border-gray-300">')
                      .replace(/\n/g, '<br>')
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
