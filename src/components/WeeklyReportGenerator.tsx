'use client';

import { useState } from 'react';

interface WeeklyReportGeneratorProps {
  projectId: number;
  projectName: string;
}

interface WeeklyReportData {
  projectName: string;
  period: string;
  completedTasks: any[];
  inProgressTasks: any[];
  upcomingTasks: any[];
  weeklyReport: string;
}

export default function WeeklyReportGenerator({ projectId, projectName }: WeeklyReportGeneratorProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<WeeklyReportData | null>(null);
  const [error, setError] = useState('');

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('시작일과 종료일을 모두 입력해주세요.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('시작일은 종료일보다 이전이어야 합니다.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`/api/projects/${projectId}/weekly-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setReportData(result.data);
      } else {
        setError(result.error || '주간회의록 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('주간회의록 생성 에러:', error);
      setError('주간회의록 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (reportData?.weeklyReport) {
      navigator.clipboard.writeText(reportData.weeklyReport);
      alert('주간회의록이 클립보드에 복사되었습니다!');
    }
  };

  const downloadReport = () => {
    if (reportData?.weeklyReport) {
      const blob = new Blob([reportData.weeklyReport], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}_주간회의록_${startDate}_${endDate}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        주간회의록 생성 - {projectName}
      </h3>

      {!reportData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-4 rounded-md font-medium hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isGenerating ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                주간회의록 생성 중...
              </div>
            ) : (
              '📝 주간회의록 생성하기'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 요약 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">📊 요약 정보</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{reportData.completedTasks.length}</div>
                <div className="text-gray-600">완료된 작업</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{reportData.inProgressTasks.length}</div>
                <div className="text-gray-600">진행중 작업</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{reportData.upcomingTasks.length}</div>
                <div className="text-gray-600">예정된 작업</div>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex space-x-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              📋 클립보드에 복사
            </button>
            <button
              onClick={downloadReport}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              💾 파일로 다운로드
            </button>
            <button
              onClick={() => setReportData(null)}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              🔄 다시 생성
            </button>
          </div>

          {/* 생성된 주간회의록 */}
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">📄 생성된 주간회의록</h4>
            </div>
            <div className="p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed overflow-x-auto">
                {reportData.weeklyReport}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
