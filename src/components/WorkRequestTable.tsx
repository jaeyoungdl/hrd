'use client';

import React from 'react';
import { Task } from '@/types';

interface TaskTableProps {
  tasks: Task[];
  loading?: boolean;
  onAddTask?: () => void;
  onSaveTask?: (task: Partial<Task>) => void;
  onCancelAdd?: () => void;
  project?: {
    startMonth: string;
    endMonth: string;
    pmId?: number;
    frontendMembers?: number[];
    backendMembers?: number[];
    designerMembers?: number[];
    uxMembers?: number[];
    appMembers?: number[];
    aiMembers?: number[];
  };
  projectMembers?: Array<{ id: number; name: string; position: string }>;
  currentUserId?: number;
  onTaskUpdate?: () => void;
}

export default function TaskTable({ tasks, loading, onAddTask, onSaveTask, onCancelAdd, project, projectMembers, currentUserId, onTaskUpdate }: TaskTableProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [showAllTasks, setShowAllTasks] = React.useState(false);
  const [newTask, setNewTask] = React.useState({
    title: '',
    month: project?.startMonth || '',
    category: '개발' as '개발' | '분석/설계',
    part: 'frontend' as 'frontend' | 'backend' | 'designer' | '기획' | 'app' | 'ai',
    assigneeName: '',
    status: '대기' as const,
    startDate: '',
    endDate: ''
  });
  const [errors, setErrors] = React.useState<{[key: string]: string}>({});

  const handleAddClick = () => {
    setIsAdding(true);
    setErrors({});
    onAddTask?.();
  };

  // 유효성 검사
  const validateTask = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!newTask.title.trim()) {
      newErrors.title = 'Task 제목을 입력하세요';
    }
    if (!newTask.month) {
      newErrors.month = '월을 선택하세요';
    }
    if (!newTask.assigneeName) {
      newErrors.assigneeName = '담당자를 선택하세요';
    }
    if (!newTask.startDate) {
      newErrors.startDate = '시작일을 입력하세요';
    }
    if (!newTask.endDate) {
      newErrors.endDate = '종료일을 입력하세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateTask()) {
      return;
    }
    
    onSaveTask?.(newTask);
    setNewTask({
      title: '',
      month: project?.startMonth || '',
      category: '개발' as '개발' | '분석/설계',
      part: 'frontend' as 'frontend' | 'backend' | 'designer' | '기획' | 'app' | 'ai',
      assigneeName: '',
      status: '대기' as const,
      startDate: '',
      endDate: ''
    });
    setErrors({});
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewTask({
      title: '',
      month: project?.startMonth || '',
      category: '개발' as '개발' | '분석/설계',
      part: 'frontend' as 'frontend' | 'backend' | 'designer' | '기획' | 'app' | 'ai',
      assigneeName: '',
      status: '대기' as const,
      startDate: '',
      endDate: ''
    });
    setErrors({});
    onCancelAdd?.();
  };

  // 프로젝트 기간 내의 월 옵션 생성
  const generateMonthOptions = () => {
    if (!project) return [];
    
    const options = [];
    const startDate = new Date(project.startMonth + '-01');
    const endDate = new Date(project.endMonth + '-01');
    
    const current = new Date(startDate);
    while (current <= endDate) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
      current.setMonth(current.getMonth() + 1);
    }
    
    return options;
  };

  // 파트별 멤버 가져오기
  const getMembersByPart = (part: string) => {
    if (!projectMembers) return [];
    
    return projectMembers.filter(member => {
      switch (part) {
        case 'frontend':
          return project?.frontendMembers?.includes(member.id);
        case 'backend':
          return project?.backendMembers?.includes(member.id);
        case 'designer':
          return project?.designerMembers?.includes(member.id);
        case '기획':
          return project?.uxMembers?.includes(member.id);
        case 'app':
          return project?.appMembers?.includes(member.id);
        case 'ai':
          return project?.aiMembers?.includes(member.id);
        default:
          return false;
      }
    });
  };

  // 파트 변경 시 담당자 자동 선택
  const handlePartChange = (part: string) => {
    const members = getMembersByPart(part);
    setNewTask(prev => ({
      ...prev,
      part: part as any,
      assigneeName: members.length === 1 ? members[0].name : ''
    }));
  };

  // 담당자 변경 시 파트 자동 설정
  const handleAssigneeChange = (assigneeName: string) => {
    if (!projectMembers) return;
    
    const selectedMember = projectMembers.find(member => member.name === assigneeName);
    if (selectedMember) {
      let part = '';
      if (project?.frontendMembers?.includes(selectedMember.id)) part = 'frontend';
      else if (project?.backendMembers?.includes(selectedMember.id)) part = 'backend';
      else if (project?.designerMembers?.includes(selectedMember.id)) part = 'designer';
      else if (project?.uxMembers?.includes(selectedMember.id)) part = '기획';
      else if (project?.appMembers?.includes(selectedMember.id)) part = 'app';
      else if (project?.aiMembers?.includes(selectedMember.id)) part = 'ai';
      
      setNewTask(prev => ({
        ...prev,
        assigneeName,
        part: part as any
      }));
    }
  };

  // PM 확인 버튼 클릭
  const handlePMConfirm = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/pm-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ PM 확인 완료:', result.data);
        onTaskUpdate?.();
      } else {
        console.error('❌ PM 확인 실패:', result.error);
        alert(`PM 확인에 실패했습니다: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ PM 확인 에러:', error);
      alert('PM 확인 중 오류가 발생했습니다.');
    }
  };

  // Task 상태 변경
  const handleStatusChange = async (taskId: number, newStatus: '대기' | '진행중' | '완료' | '보류') => {
    try {
      console.log('🔄 상태 변경 시도:', { taskId, newStatus });
      
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log('📡 API 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API 에러 응답:', errorData);
        throw new Error(`상태 변경에 실패했습니다. (${response.status}: ${errorData.error || response.statusText})`);
      }

      const result = await response.json();
      console.log('📋 API 응답 데이터:', result);
      
      if (result.success) {
        console.log('✅ 상태 변경 완료:', result.data);
        onTaskUpdate?.();
      } else {
        throw new Error(result.error || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 상태 변경 에러:', error);
      const errorMessage = error instanceof Error ? error.message : '상태 변경에 실패했습니다.';
      alert(errorMessage);
    }
  };

  // PM 확인 버튼이 활성화되어야 하는지 확인
  const shouldShowPMConfirmButton = (task: Task) => {
    if (!currentUserId || !project?.pmId || currentUserId !== project.pmId) {
      return false;
    }

    if (task.pmConfirmed) {
      return false;
    }

    return true;
  };

  // Task가 현재 사용자의 것인지 확인
  const isMyTask = (task: Task) => {
    return currentUserId && task.assigneeId === currentUserId;
  };

  // 상태별 액션 버튼 렌더링
  const renderActionButton = (task: Task) => {
    if (!isMyTask(task)) {
      return <span className="text-gray-400 text-xs">-</span>;
    }

    switch (task.status) {
      case '대기':
        return (
          <button
            onClick={() => handleStatusChange(task.id, '진행중')}
            className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
          >
            시작
          </button>
        );
      case '진행중':
        return (
          <div className="flex space-x-1">
            <button
              onClick={() => handleStatusChange(task.id, '완료')}
              className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors"
            >
              완료
            </button>
            <button
              onClick={() => handleStatusChange(task.id, '보류')}
              className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600 transition-colors"
            >
              보류
            </button>
          </div>
        );
      case '보류':
        return (
          <button
            onClick={() => handleStatusChange(task.id, '진행중')}
            className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
          >
            재시작
          </button>
        );
      case '완료':
        return <span className="text-gray-400 text-xs">-</span>;
      default:
        return <span className="text-gray-400 text-xs">-</span>;
    }
  };

  // 필터링된 Task 목록
  const filteredTasks = React.useMemo(() => {
    if (!currentUserId) return tasks;
    
    if (showAllTasks) {
      return tasks;
    } else {
      // 나의 Task만 보기 - 담당자가 현재 사용자인 Task들
      return tasks.filter(task => task.assigneeId === currentUserId);
    }
  }, [tasks, currentUserId, showAllTasks]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center animate-spin">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <div className="skeleton h-4 rounded-full w-1/3 mx-auto"></div>
            <div className="skeleton h-3 rounded-full w-1/2 mx-auto"></div>
          </div>
          <p className="text-gray-500 mt-4 font-medium">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 각 상태별 Task 개수 계산
  const getTaskCounts = () => {
    return {
      대기: filteredTasks.filter(task => task.status === '대기').length,
      진행중: filteredTasks.filter(task => task.status === '진행중').length,
      완료: filteredTasks.filter(task => task.status === '완료').length,
      보류: filteredTasks.filter(task => task.status === '보류').length
    };
  };

  const taskCounts = getTaskCounts();

  return (
    <div className="space-y-6">
      {/* 새 Task 추가 섹션 */}
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-gray-900">Task 관리</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAllTasks(false)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    !showAllTasks
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  나의 Task
                </button>
                <button
                  onClick={() => setShowAllTasks(true)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    showAllTasks
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  전체 Task
                </button>
              </div>
            </div>
            <button
              onClick={handleAddClick}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Task 추가
            </button>
          </div>
        </div>

        {/* 새 Task 입력 테이블 */}
        {isAdding && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-3 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider w-48 min-w-40">상세Task</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider w-24">월</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider w-20">분류</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider w-20">파트</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider w-24">담당자</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider w-20">진행상태</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider w-24">시작일</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider w-24">종료일</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider w-16">PM확인</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider w-24">PM확인날짜</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider w-20">작업</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-blue-50 border-2 border-blue-200">
                  <td className="px-3 py-4 text-sm w-48 min-w-40">
                    <div>
                      <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) => {
                          setNewTask(prev => ({ ...prev, title: e.target.value }));
                          if (errors.title) {
                            setErrors(prev => ({ ...prev, title: '' }));
                          }
                        }}
                        placeholder="Task 제목을 입력하세요"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm ${
                          errors.title 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {errors.title && (
                        <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm w-20">
                    <div>
                      <select
                        value={newTask.month}
                        onChange={(e) => {
                          setNewTask(prev => ({ ...prev, month: e.target.value }));
                          if (errors.month) {
                            setErrors(prev => ({ ...prev, month: '' }));
                          }
                        }}
                        className={`w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 text-xs ${
                          errors.month 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">월 선택</option>
                        {generateMonthOptions().map(month => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                      {errors.month && (
                        <p className="text-red-500 text-xs mt-1">{errors.month}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap w-20">
                    <select
                      value={newTask.category}
                      onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value as '개발' | '분석/설계' }))}
                      className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    >
                      <option value="개발">개발</option>
                      <option value="분석/설계">분석/설계</option>
                    </select>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap w-20">
                    <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {newTask.part}
                    </span>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm w-24">
                    <div>
                      <select
                        value={newTask.assigneeName}
                        onChange={(e) => {
                          handleAssigneeChange(e.target.value);
                          if (errors.assigneeName) {
                            setErrors(prev => ({ ...prev, assigneeName: '' }));
                          }
                        }}
                        className={`w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 text-xs ${
                          errors.assigneeName 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">담당자 선택</option>
                        {projectMembers?.map(member => (
                          <option key={member.id} value={member.name}>{member.name}</option>
                        ))}
                      </select>
                      {errors.assigneeName && (
                        <p className="text-red-500 text-xs mt-1">{errors.assigneeName}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap w-20">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      대기
                    </span>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm w-28">
                    <div>
                      <input
                        type="date"
                        value={newTask.startDate}
                        onChange={(e) => {
                          setNewTask(prev => ({ ...prev, startDate: e.target.value }));
                          if (errors.startDate) {
                            setErrors(prev => ({ ...prev, startDate: '' }));
                          }
                        }}
                        className={`w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 text-xs text-black ${
                          errors.startDate 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {errors.startDate && (
                        <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm w-28">
                    <div>
                      <input
                        type="date"
                        value={newTask.endDate}
                        onChange={(e) => {
                          setNewTask(prev => ({ ...prev, endDate: e.target.value }));
                          if (errors.endDate) {
                            setErrors(prev => ({ ...prev, endDate: '' }));
                          }
                        }}
                        className={`w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 text-xs text-black ${
                          errors.endDate 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {errors.endDate && (
                        <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm w-20">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      대기중
                    </span>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm w-24">
                    <span className="text-gray-400">-</span>
                  </td>
                  <td className="px-2 py-4 whitespace-nowrap text-sm w-20">
                    <span className="text-gray-400 text-xs">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 저장/취소 버튼 */}
        {isAdding && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
              >
                저장
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 각 상태별 테이블 - 세로로 나열 */}
      {(['대기', '진행중', '완료', '보류'] as const).map((status) => {
        const statusTasks = filteredTasks.filter(task => task.status === status);
        
        return (
          <div key={status} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* 테이블 헤더 */}
            <div className={`px-6 py-4 border-b border-gray-200 ${
              status === '대기' ? 'bg-orange-50' :
              status === '진행중' ? 'bg-blue-50' :
              status === '완료' ? 'bg-green-50' :
              'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-medium ${
                  status === '대기' ? 'text-orange-900' :
                  status === '진행중' ? 'text-blue-900' :
                  status === '완료' ? 'text-green-900' :
                  'text-gray-900'
                }`}>
                  {status} 
                  <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    status === '대기' ? 'bg-orange-100 text-orange-700' :
                    status === '진행중' ? 'bg-blue-100 text-blue-700' :
                    status === '완료' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {statusTasks.length}개
                  </span>
                </h3>
              </div>
            </div>

            {/* 테이블 내용 */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48 min-w-40">상세Task</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">월</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">분류</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">파트</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">담당자</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">진행상태</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">시작일</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">종료일</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">PM확인</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">PM확인날짜</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">작업</th>
                  </tr>
                </thead>
          <tbody className="bg-white divide-y divide-gray-200">
                  {statusTasks.length === 0 ? (
              <tr>
                      <td colSpan={11} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="text-center">
                            <p className="text-gray-500 font-medium">{status} 상태의 Task가 없습니다</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
                    statusTasks.map((task, index) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-3 py-4 text-sm text-gray-900 w-48 min-w-40">
                          <div className="font-medium break-words">{task.title}</div>
                    {task.description && (
                            <div className="text-xs text-gray-500 mt-1 break-words">{task.description}</div>
                    )}
                  </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700 font-medium w-20">
                    {task.month}
                  </td>
                        <td className="px-2 py-4 whitespace-nowrap w-20">
                          <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {task.category}
                    </span>
                  </td>
                        <td className="px-2 py-4 whitespace-nowrap w-20">
                          <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {task.part}
                          </span>
                  </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700 w-24">
                    {task.assigneeName}
                  </td>
                        <td className="px-2 py-4 whitespace-nowrap w-20">
                          <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${
                            task.status === '완료' ? 'bg-green-100 text-green-800' :
                            task.status === '진행중' ? 'bg-blue-100 text-blue-800' :
                            task.status === '대기' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700 w-24">
                    {task.startDate}
                  </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700 w-24">
                    {task.endDate}
                  </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm w-16">
                          {shouldShowPMConfirmButton(task) ? (
                            <button
                              onClick={() => handlePMConfirm(task.id)}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                            >
                              확인
                            </button>
                          ) : (
                            <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${
                      task.pmConfirmed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {task.pmConfirmed ? '확인됨' : '대기중'}
                    </span>
                          )}
                  </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700 w-24">
                          {task.pmConfirmedDate || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm w-20">
                          {renderActionButton(task)}
                        </td>
                      </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
          </div>
        );
      })}
    </div>
  );
}