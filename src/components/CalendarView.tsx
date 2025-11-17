'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types';

interface CalendarViewProps {
  tasks: Task[];
  loading: boolean;
  currentUserId?: number;
}

export default function CalendarView({ tasks, loading, currentUserId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 현재 월의 첫째 날과 마지막 날
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // 캘린더 시작일 (첫째 날이 속한 주의 일요일)
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
  
  // 캘린더 종료일 (마지막 날이 속한 주의 토요일)
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));

  // 특정 날짜의 테스크 가져오기 (본인 작업만)
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.startDate || !task.endDate) return false;
      
      // 본인 작업만 필터링
      if (currentUserId && task.assigneeId !== currentUserId) return false;
      
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      
      // 날짜가 테스크 기간에 포함되는지 확인
      return date >= taskStart && date <= taskEnd;
    });
  };

  // 테스크 상태별 색상
  const getTaskColor = (status: string) => {
    switch (status) {
      case '완료': return 'bg-green-100 border-green-300 text-green-800';
      case '진행중': return 'bg-blue-100 border-blue-300 text-blue-800';
      case '대기': return 'bg-gray-100 border-gray-300 text-gray-800';
      case '보류': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  // 우선순위별 아이콘
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  // 월 변경
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 특정 날짜의 모든 테스크 보기
  const showAllTasks = (date: Date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
  };

  // 캘린더 날짜 배열 생성
  const calendarDays = [];
  const currentDateIter = new Date(startDate);
  
  while (currentDateIter <= endDate) {
    calendarDays.push(new Date(currentDateIter));
    currentDateIter.setDate(currentDateIter.getDate() + 1);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* 헤더 컨트롤 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })} 캘린더
        </h3>
        
        <div className="flex items-center gap-3">
          {/* 월 변경 버튼 */}
          <button
            onClick={() => changeMonth('prev')}
            className="p-2 rounded hover:bg-gray-100 text-black"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            오늘
          </button>
          
          <button
            onClick={() => changeMonth('next')}
            className="p-2 rounded hover:bg-gray-100 text-black"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* 요일 헤더 */}
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}

        {/* 캘린더 날짜들 */}
        {calendarDays.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isToday = date.toDateString() === new Date().toDateString();
          const dayTasks = getTasksForDate(date);
          
          return (
            <div
              key={index}
              className={`bg-white min-h-[120px] p-2 ${
                !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
              } ${isToday ? 'bg-blue-50' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                {date.getDate()}
              </div>
              
              {/* 해당 날짜의 테스크들 */}
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={`text-xs p-1 rounded border-l-2 ${getTaskColor(task.status)} truncate`}
                  >
                    <div className="flex items-center gap-1">
                      <span>{getPriorityIcon(task.priority)}</span>
                      <span className="truncate">{task.title}</span>
                    </div>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <button
                    onClick={() => showAllTasks(date)}
                    className="text-xs text-blue-500 hover:text-blue-700 text-center w-full hover:bg-blue-50 rounded"
                  >
                    +{dayTasks.length - 3}개 더
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-black">완료</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span className="text-black">진행중</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-black">대기</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span className="text-black">보류</span>
          </div>
        </div>
      </div>

      {/* 테스크 상세 모달 */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDate.toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })} 테스크
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {getTasksForDate(selectedDate).length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  이 날짜에는 테스크가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {getTasksForDate(selectedDate).map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border-l-4 ${getTaskColor(task.status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{getPriorityIcon(task.priority)}</span>
                            <h4 className="font-medium text-sm">{task.title}</h4>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>상태: {task.status}</span>
                            <span>파트: {task.part}</span>
                            {task.startDate && task.endDate && (
                              <span>
                                {new Date(task.startDate).toLocaleDateString('ko-KR')} ~ {new Date(task.endDate).toLocaleDateString('ko-KR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {task.projectName || `프로젝트 #${task.id}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
