'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Task, FilterOptions, Project } from '@/types';
import TaskTable from '@/components/WorkRequestTable';
import ProjectTable from '@/components/ProjectTable';
import FilterSection from '@/components/FilterSection';
import PersonalDashboard from '@/components/PersonalDashboard';
import ProjectMembers from '@/components/ProjectMembers';
import CalendarView from '@/components/CalendarView';
import WeeklyReportPage from '@/components/WeeklyReportPage';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [stats, setStats] = useState({
    대기: 0,
    진행중: 0,
    완료: 0,
    보류: 0
  });
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [projectMembers, setProjectMembers] = useState<Array<{ id: number; name: string; position: string }>>([]);
  const [currentView, setCurrentView] = useState<'home' | 'projects' | 'project-detail' | 'timeline' | 'weekly-report'>('home');
  const [dashboardData, setDashboardData] = useState<any>(null);
  // 인증 체크
  useEffect(() => {
    if (status === 'loading') return; // 로딩 중
    if (status === 'unauthenticated') {
      // 세션이 확실히 없을 때만 로그인 페이지로 이동
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  // Task 데이터 가져오기
  const fetchTasks = async (filterOptions: FilterOptions = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (selectedProject) {
        params.append('projectId', selectedProject.id.toString());
      }
      
      if (filterOptions.status) {
        params.append('status', filterOptions.status);
      }
      
      if (filterOptions.part) {
        params.append('part', filterOptions.part);
      }
      
      if (filterOptions.month) {
        params.append('month', filterOptions.month);
      }

      console.log('🔄 Task 데이터 가져오는 중...', params.toString());
      const response = await fetch(`/api/tasks?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 Task API 응답:', result);
      
      if (result.success) {
        setTasks(result.data);
        console.log('✅ Task 데이터 설정 완료:', result.data.length, '개');
        
        // 통계도 함께 업데이트
        await fetchStats();
      } else {
        throw new Error(result.error || 'Task 데이터를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ API 호출 에러:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // 특정 프로젝트의 Task 데이터 가져오기
  const fetchTasksForProject = async (projectId: number, filterOptions: FilterOptions = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('projectId', projectId.toString());
      
      if (filterOptions.status) {
        params.append('status', filterOptions.status);
      }
      
      if (filterOptions.part) {
        params.append('part', filterOptions.part);
      }
      
      if (filterOptions.month) {
        params.append('month', filterOptions.month);
      }

      console.log('🔄 Task 데이터 가져오는 중...', params.toString());
      const response = await fetch(`/api/tasks?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 Task API 응답:', result);
      
      if (result.success) {
        setTasks(result.data);
        console.log('✅ Task 데이터 설정 완료:', result.data.length, '개');
        
        // 통계도 함께 업데이트
        await fetchStats();
      } else {
        throw new Error(result.error || 'Task 데이터를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ API 호출 에러:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // 통계 데이터 가져오기
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedProject) {
        params.append('projectId', selectedProject.id.toString());
      }

      const response = await fetch(`/api/stats?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data.status);
      } else {
        throw new Error(result.error || '통계 데이터를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('통계 데이터 가져오기 에러:', error);
      setStats({ 대기: 0, 진행중: 0, 완료: 0, 보류: 0 });
    }
  };

  // 프로젝트 데이터 가져오기
  const fetchProjects = async () => {
    try {
      console.log('🔄 프로젝트 데이터 가져오는 중...');
      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 프로젝트 API 응답:', result);
      
      if (result.success) {
        setProjects(result.data);
        console.log('✅ 프로젝트 데이터 설정 완료:', result.data.length, '개');
      } else {
        throw new Error(result.error || '프로젝트 데이터를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ 프로젝트 데이터 가져오기 에러:', error);
      setProjects([]);
    }
  };

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/users/me');
        const result = await response.json();
        if (result.success) {
          setCurrentUserId(result.data.id);
        }
      } catch (error) {
        console.error('현재 사용자 정보 가져오기 에러:', error);
      }
    };

    if (session) {
      fetchCurrentUser();
    }
  }, [session]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchTasks();
    fetchStats();
    fetchProjects();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/personal');
      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('대시보드 데이터 가져오기 에러:', error);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchTasks();
    fetchStats();
    fetchProjects();
    fetchDashboardData();
  }, []);


  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    fetchTasks(newFilters);
  };

  // 프로젝트 상태 확인
  const isProjectActive = (project: Project) => {
    const currentDate = new Date();
    const endDate = new Date(project.endMonth + '-01');
    // 해당 월의 마지막 날로 설정
    const lastDayOfMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0);
    return currentDate <= lastDayOfMonth;
  };

  // 사용자가 참여중인 프로젝트인지 확인
  const isUserParticipating = (project: Project) => {
    if (!currentUserId) return false;
    
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
  };

  const activeProjects = projects.filter(project => isProjectActive(project) && isUserParticipating(project));
  const completedProjects = projects.filter(project => !isProjectActive(project) && isUserParticipating(project));

  // 프로젝트 선택 핸들러
  const handleProjectSelect = (project: Project) => {
    console.log('🎯 프로젝트 선택:', project.id, project.name);
    setSelectedProject(project);
    setCurrentView('project-detail');
    // 선택된 프로젝트의 Task를 API에서 가져오기 (project.id 직접 전달)
    fetchTasksForProject(project.id, filters);
    // 프로젝트 멤버 가져오기
    fetchProjectMembers(project.id);
  };


  // 프로젝트 목록 새로고침
  const refreshProjects = () => {
    fetchProjects();
  };

  // 프로젝트 멤버 가져오기
  const fetchProjectMembers = async (projectId: number) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`);
      const result = await response.json();
      
      if (result.success) {
        setProjectMembers(result.data);
      } else {
        console.error('프로젝트 멤버 조회 실패:', result.error);
        setProjectMembers([]);
      }
    } catch (error) {
      console.error('프로젝트 멤버 조회 에러:', error);
      setProjectMembers([]);
    }
  };

  // Task 저장
  const handleSaveTask = async (taskData: any) => {
    if (!selectedProject) {
      console.error('선택된 프로젝트가 없습니다.');
      return;
    }

    try {
      const response = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskData,
          projectId: selectedProject.id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Task 저장 성공:', result.data);
        // Task 목록 새로고침
        await fetchTasks();
        // 통계 새로고침
        await fetchStats();
      } else {
        console.error('❌ Task 저장 실패:', result.error);
        alert(`Task 저장에 실패했습니다: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Task 저장 에러:', error);
      alert('Task 저장 중 오류가 발생했습니다.');
    }
  };

  // Task 업데이트 (PM 확인 후)
  const handleTaskUpdate = () => {
    fetchTasks();
    fetchStats();
  };


  // 로딩 중이거나 인증되지 않은 경우
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // 리다이렉트 중
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* 사이드바 - 고정 */}
        <aside className="w-64 min-w-64 flex-shrink-0 bg-white shadow-lg border-r border-gray-200 flex flex-col fixed left-0 top-0 h-full z-10">
        {/* 사이드바 헤더 */}
        <div className="pl-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img 
              src="/logoBlack.webp" 
              alt="로고" 
              className="w-15 h-15 object-contain flex-shrink-0"
            />
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              업무관리시스템
            </h1>
          </div>
        </div>

               {/* 네비게이션 메뉴 */}
               <nav className="flex-1 p-3">
                 <div className="space-y-6">

                   {/* 홈 */}
                   <div>
                     <button
                       onClick={() => {
                         setCurrentView('home');
                         setSelectedProject(null);
                       }}
                       className={`w-full flex items-center p-3 rounded-md text-left ${
                         currentView === 'home'
                           ? 'bg-blue-50 text-blue-700 border border-blue-200'
                           : 'hover:bg-gray-100 text-gray-600'
                       }`}
                     >
                       <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                         <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                         </svg>
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="text-sm font-medium">홈</div>
                         <div className="text-xs text-gray-500">대시보드</div>
                       </div>
                     </button>
                   </div>
                   {/* 전체 프로젝트 */}
                   <div>
                     <button
                       onClick={() => {
                         setCurrentView('projects');
                         setSelectedProject(null);
                       }}
                       className={`w-full flex items-center p-3 rounded-md text-left ${
                         currentView === 'projects'
                           ? 'bg-blue-50 text-blue-700 border border-blue-200'
                           : 'hover:bg-gray-100 text-gray-600'
                       }`}
                     >
                       <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                         <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                         </svg>
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="text-sm font-medium">전체 프로젝트</div>
                         <div className="text-xs text-gray-500">모든 프로젝트 보기</div>
                       </div>
                     </button>
                   </div>

                  {/* 타임라인 */}
                  <div>
                    <button
                      onClick={() => {
                        setCurrentView('timeline');
                        setSelectedProject(null);
                      }}
                      className={`w-full flex items-center p-3 rounded-md text-left ${
                        currentView === 'timeline'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">캘린더</div>
                        <div className="text-xs text-gray-500">월별 일정 보기</div>
                      </div>
                    </button>
                  </div>

                  {/* 회의록 작성 */}
                  <div>
                    <button
                      onClick={() => {
                        setCurrentView('weekly-report');
                        setSelectedProject(null);
                      }}
                      className={`w-full flex items-center p-3 rounded-md text-left ${
                        currentView === 'weekly-report'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">회의록 작성</div>
                        <div className="text-xs text-gray-500">주간회의록 생성</div>
                      </div>
                    </button>
                  </div>

                   
                 </div>
               </nav>
               {/* 사이드바 하단 */}
               <div className="p-3 border-t border-gray-200 bg-gray-50">
                 <div className="flex items-center justify-between text-xs text-gray-500">
                   <div className="flex items-center space-x-2">
                     <span>FUiT</span>
                     {session && (
                       <span className="text-gray-400">| {session.user?.name}</span>
                     )}
                   </div>
                   <button 
                     onClick={() => signOut({ callbackUrl: `${window.location.protocol}//${window.location.host}${window.location.pathname}` })}
                     className="text-gray-400 hover:text-gray-600"
                     title="로그아웃"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                     </svg>
                   </button>
                 </div>
               </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col ml-64">
        {/* 상단 헤더 - 고정 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 fixed top-0 right-0 left-64 z-20 h-16">
          <div className="flex items-center justify-between h-full">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedProject ? selectedProject.name : `안녕하세요, ${session?.user?.name || '사용자'}님! 👋`}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedProject
                  ? `${selectedProject.startMonth} ~ ${selectedProject.endMonth} | PM: ${selectedProject.pmName}`
                  : `${session?.user?.position || '개발자'} • 오늘도 좋은 하루 되세요`
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => signOut({ callbackUrl: `${window.location.protocol}//${window.location.host}${window.location.pathname}` })}
                className="text-red-500 hover:text-red-700 transition-colors flex items-center space-x-2"
                title="로그아웃"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm">로그아웃</span>
              </button>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-6 overflow-auto space-y-6 pt-20">
          {currentView === 'home' ? (
            <PersonalDashboard />
          ) : currentView === 'projects' ? (
            <ProjectTable 
              projects={projects} 
              loading={loading}
              onProjectSelect={handleProjectSelect}
              onRefresh={refreshProjects}
              onProjectCreated={(project) => {
                console.log('새 프로젝트 생성됨:', project);
                // 프로젝트 목록 새로고침
                fetchProjects();
              }}
            />
          ) : currentView === 'timeline' ? (
            <CalendarView 
              tasks={tasks} 
              loading={loading}
              currentUserId={currentUserId || undefined}
            />
          ) : currentView === 'weekly-report' ? (
            <WeeklyReportPage currentUserId={currentUserId || undefined} />
          ) : (
            <>
              {/* 프로젝트 멤버 섹션 */}
              {selectedProject && (
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                  <ProjectMembers
                    projectId={selectedProject.id}
                    pmId={selectedProject.pmId}
                    frontendMembers={selectedProject.frontendMembers || []}
                    backendMembers={selectedProject.backendMembers || []}
                    designerMembers={selectedProject.designerMembers || []}
                    uxMembers={selectedProject.uxMembers || []}
                    appMembers={selectedProject.appMembers || []}
                    aiMembers={selectedProject.aiMembers || []}
                  />
                </div>
              )}


              <TaskTable 
                tasks={tasks} 
                loading={loading} 
                onAddTask={() => {
                  console.log('Task 추가 모드 활성화');
                }}
                onSaveTask={handleSaveTask}
                onCancelAdd={() => {
                  console.log('Task 추가 취소');
                }}
                project={selectedProject ? {
                  startMonth: selectedProject.startMonth,
                  endMonth: selectedProject.endMonth,
                  pmId: selectedProject.pmId,
                  frontendMembers: selectedProject.frontendMembers,
                  backendMembers: selectedProject.backendMembers,
                  designerMembers: selectedProject.designerMembers,
                  uxMembers: selectedProject.uxMembers,
                  appMembers: selectedProject.appMembers,
                  aiMembers: selectedProject.aiMembers
                } : undefined}
                projectMembers={projectMembers}
                currentUserId={currentUserId || undefined}
                onTaskUpdate={handleTaskUpdate}
              />
            </>
          )}
      </main>
      </div>
    </div>
  );
}