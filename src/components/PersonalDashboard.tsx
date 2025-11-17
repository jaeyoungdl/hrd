'use client';

import React, { useState, useEffect } from 'react';


interface DashboardData {
  user: {
    id: number;
    name: string;
    position: string;
  };
  todayTasks: Array<{
    id: number;
    title: string;
    status: string;
    start_date: string;
    end_date: string;
    priority?: string;
    project_name: string;
  }>;
  myTasks: Array<{
    id: number;
    title: string;
    status: string;
    start_date: string;
    end_date: string;
    project_name: string;
    pm_name: string;
  }>;
  taskStats: {
    대기: number;
    진행중: number;
    완료: number;
    보류: number;
  };
  summary: {
    totalTasks: number;
    completionRate: number;
    todayTaskCount: number;
    inProgressCount: number;
  };
}

export default function PersonalDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/personal');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        console.error('대시보드 데이터 로드 실패:', result.error);
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">대시보드 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료': return 'bg-green-100 text-green-800';
      case '진행중': return 'bg-blue-100 text-blue-800';
      case '대기': return 'bg-orange-100 text-orange-800';
      case '보류': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">전체 Task</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">완료율</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">오늘 할일</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.todayTaskCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">진행중</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.inProgressCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 오늘의 할일 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 오늘의 할일</h3>
          {data.todayTasks.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {data.todayTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate" title={task.title}>
                      {task.title.length > 20 ? `${task.title.substring(0, 20)}...` : task.title}
                    </p>
                    <p className="text-sm text-gray-600 truncate">{task.project_name}</p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    {task.priority && (
                      <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'high' ? '🔥' : task.priority === 'medium' ? '⚡' : '📌'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">오늘 할 일이 없습니다! 🎉</p>
          )}
        </div>

        {/* Task 상태 분포 원형차트 */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            Task 상태 분포
          </h3>
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-56 h-56">
              {/* 원형차트 */}
              <svg className="w-56 h-56 transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
                {(() => {
                  const total = data.summary.totalTasks;
                  if (total === 0) return null;
                  
                  let cumulativePercentage = 0;
                  const colors = {
                    '완료': 'url(#gradient-green)',
                    '진행중': 'url(#gradient-blue)', 
                    '대기': 'url(#gradient-orange)',
                    '보류': 'url(#gradient-gray)'
                  };
                  
                  return (
                    <>
                      {/* 그라디언트 정의 */}
                      <defs>
                        <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#1D4ED8" />
                        </linearGradient>
                        <linearGradient id="gradient-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#D97706" />
                        </linearGradient>
                        <linearGradient id="gradient-gray" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6B7280" />
                          <stop offset="100%" stopColor="#4B5563" />
                        </linearGradient>
                      </defs>
                      
                      {Object.entries(data.taskStats).map(([status, count], index) => {
                        const percentage = (count / total) * 100;
                        if (percentage === 0) return null;
                        
                        const startAngle = cumulativePercentage * 3.6;
                        const endAngle = (cumulativePercentage + percentage) * 3.6;
                        
                        const radius = 50;
                        const centerX = 50;
                        const centerY = 50;
                        
                        const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
                        const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
                        const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
                        const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
                        
                        const largeArcFlag = percentage > 50 ? 1 : 0;
                        const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                        
                        cumulativePercentage += percentage;
                        
                        return (
                          <path
                            key={status}
                            d={pathData}
                            fill={colors[status as keyof typeof colors]}
                            className="hover:opacity-90 transition-all duration-300 hover:scale-105"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
          
          {/* 깔끔한 범례 */}
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(data.taskStats).map(([status, count]) => {
              const percentage = data.summary.totalTasks > 0 ? Math.round((count / data.summary.totalTasks) * 100) : 0;
              
              return (
                <div key={status} className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className={`w-4 h-4 rounded-full mr-3 shadow-sm ${
                    status === '완료' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                    status === '진행중' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                    status === '대기' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                    'bg-gradient-to-r from-gray-400 to-gray-600'
                  }`}></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">{status}</div>
                    <div className="text-xs text-gray-500">{percentage}%</div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 칸반보드 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 칸반보드</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 대기 */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-orange-800">대기</h4>
              <span className="bg-orange-200 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">
                {data.taskStats.대기}
              </span>
            </div>
            <div className="space-y-2">
              {data.myTasks
                .filter(task => task.status === '대기')
                .slice(0, 5)
                .map((task) => (
                  <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-orange-200">
                    <p className="text-sm font-medium text-gray-900 mb-1">{task.title}</p>
                    <p className="text-xs text-gray-600">{task.project_name}</p>
                    {task.start_date && (
                      <p className="text-xs text-orange-600 mt-1">
                        📅 {new Date(task.start_date).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                ))}
              {data.myTasks.filter(task => task.status === '대기').length === 0 && (
                <p className="text-orange-600 text-sm text-center py-2">대기 중인 Task가 없습니다</p>
              )}
            </div>
          </div>

          {/* 진행중 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-blue-800">진행중</h4>
              <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                {data.taskStats.진행중}
              </span>
            </div>
            <div className="space-y-2">
              {data.myTasks
                .filter(task => task.status === '진행중')
                .slice(0, 5)
                .map((task) => (
                  <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-blue-200">
                    <p className="text-sm font-medium text-gray-900 mb-1">{task.title}</p>
                    <p className="text-xs text-gray-600">{task.project_name}</p>
                    {task.end_date && (
                      <p className="text-xs text-blue-600 mt-1">
                        목표일: {new Date(task.end_date).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                ))}
              {data.myTasks.filter(task => task.status === '진행중').length === 0 && (
                <p className="text-blue-600 text-sm text-center py-2">진행 중인 Task가 없습니다</p>
              )}
            </div>
          </div>

          {/* 완료 */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-green-800">완료</h4>
              <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                {data.taskStats.완료}
              </span>
            </div>
            <div className="space-y-2">
              {data.myTasks
                .filter(task => task.status === '완료')
                .slice(0, 5)
                .map((task) => (
                  <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-green-200">
                    <p className="text-sm font-medium text-gray-900 mb-1">{task.title}</p>
                    <p className="text-xs text-gray-600">{task.project_name}</p>
                    <p className="text-xs text-green-600 mt-1">
                      ✅ 완료됨
                    </p>
                  </div>
                ))}
              {data.myTasks.filter(task => task.status === '완료').length === 0 && (
                <p className="text-green-600 text-sm text-center py-2">완료된 Task가 없습니다</p>
              )}
            </div>
          </div>

          {/* 보류 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">보류</h4>
              <span className="bg-gray-200 text-gray-800 text-xs font-bold px-2 py-1 rounded-full">
                {data.taskStats.보류}
              </span>
            </div>
            <div className="space-y-2">
              {data.myTasks
                .filter(task => task.status === '보류')
                .slice(0, 5)
                .map((task) => (
                  <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-1">{task.title}</p>
                    <p className="text-xs text-gray-600">{task.project_name}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      ⏸️ 보류됨
                    </p>
                  </div>
                ))}
              {data.myTasks.filter(task => task.status === '보류').length === 0 && (
                <p className="text-gray-600 text-sm text-center py-2">보류된 Task가 없습니다</p>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
