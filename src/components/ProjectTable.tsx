'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/types';
import { useRouter } from 'next/navigation';
import ProjectCreateForm from './ProjectCreateForm';

interface ProjectTableProps {
  projects: Project[];
  loading: boolean;
  onProjectSelect?: (project: Project) => void;
  onRefresh?: () => void;
  onProjectCreated?: (project: Project) => void;
}

type ProjectFilter = 'all' | 'active' | 'completed';

interface UserInfo {
  id: number;
  name: string;
  position: string;
}

export default function ProjectTable({ projects, loading, onProjectSelect, onRefresh, onProjectCreated }: ProjectTableProps) {
  const [filter, setFilter] = useState<ProjectFilter>('active');
  const [userMap, setUserMap] = useState<Map<number, UserInfo>>(new Map());
  const [showNonParticipating, setShowNonParticipating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
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

    fetchCurrentUser();
  }, []);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      const allUserIds = new Set<number>();
      
      projects.forEach(project => {
        [
          ...(project.frontendMembers || []),
          ...(project.backendMembers || []),
          ...(project.designerMembers || []),
          ...(project.uxMembers || []),
          ...(project.appMembers || []),
          ...(project.aiMembers || [])
        ].forEach(id => allUserIds.add(id));
      });

      if (allUserIds.size === 0) return;

      try {
        const response = await fetch('/api/users/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: Array.from(allUserIds) })
        });

        const result = await response.json();
        if (result.success) {
          const newUserMap = new Map<number, UserInfo>();
          result.data.forEach((user: UserInfo) => {
            newUserMap.set(user.id, user);
          });
          setUserMap(newUserMap);
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 에러:', error);
      }
    };

    if (projects.length > 0) {
      fetchUserInfo();
    }
  }, [projects]);
  
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

  // 참여 프로젝트와 미참여 프로젝트 분리
  const participatingProjects = projects.filter(isUserParticipating);
  const nonParticipatingProjects = projects.filter(project => !isUserParticipating(project));

  // 필터링된 프로젝트 목록
  const baseProjects = showNonParticipating ? nonParticipatingProjects : participatingProjects;
  const filteredProjects = baseProjects.filter(project => {
    const isActive = isProjectActive(project);
    switch (filter) {
      case 'active':
        return isActive;
      case 'completed':
        return !isActive;
      default:
        return true;
    }
  });

  // 참여 프로젝트만의 통계
  const participatingActiveProjects = participatingProjects.filter(isProjectActive);
  const participatingCompletedProjects = participatingProjects.filter(project => !isProjectActive(project));

  // 진행률 계산 (완료된 Task 수 / 전체 Task 수)
  const getProgressPercentage = (project: Project) => {
    const totalTasks = Number(project.taskCount) || 0;
    const completedTasks = Number(project.completedTasks) || 0;
    
    console.log(`프로젝트 ${project.name}: totalTasks=${totalTasks}, completedTasks=${completedTasks}`);
    
    if (totalTasks === 0) return 0;
    
    const percentage = (completedTasks / totalTasks) * 100;
    const rounded = Math.round(percentage);
    
    console.log(`진행률 계산: ${completedTasks}/${totalTasks} = ${percentage}% → ${rounded}%`);
    
    return rounded;
  };

  // 상태별 스타일
  const getStatusStyle = (project: Project) => {
    if (isProjectActive(project)) {
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        dot: 'bg-green-400',
        label: '진행중'
      };
    } else {
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        dot: 'bg-gray-400',
        label: '종료'
      };
    }
  };

  // 프로젝트 생성 성공 핸들러
  const handleProjectCreated = (project: Project) => {
    setShowCreateForm(false);
    onProjectCreated?.(project);
    onRefresh?.(); // 프로젝트 목록 새로고침
  };

  // 프로젝트 생성 취소 핸들러
  const handleProjectCreateCancel = () => {
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 프로젝트 생성 폼이 보일 때
  if (showCreateForm) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">새 프로젝트 생성</h3>
              <p className="text-sm text-gray-500 mt-1">프로젝트 정보를 입력해주세요</p>
            </div>
            <button
              onClick={handleProjectCreateCancel}
              className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
        <div className="p-6">
          <ProjectCreateForm
            onSuccess={handleProjectCreated}
            onCancel={handleProjectCreateCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">프로젝트 목록</h3>
              <p className="text-sm text-gray-500 mt-1">총 {filteredProjects.length}개의 프로젝트</p>
            </div>
          
          {/* 필터 버튼들 */}
          <div className="flex items-center space-x-2">
            {!showNonParticipating ? (
              <>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  전체 ({participatingProjects.length})
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    filter === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  진행중 ({participatingProjects.filter(isProjectActive).length})
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    filter === 'completed'
                      ? 'bg-gray-100 text-gray-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  종료 ({participatingProjects.filter(p => !isProjectActive(p)).length})
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setShowNonParticipating(false);
                  setFilter('all');
                }}
                className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                참여 프로젝트
              </button>
            )}
            
            <button
              onClick={() => {
                setShowNonParticipating(!showNonParticipating);
                setFilter('all'); // 미참여 프로젝트 전환시 필터 초기화
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                showNonParticipating
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              미참여 프로젝트 ({nonParticipatingProjects.length})
            </button>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              프로젝트 추가
            </button>
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                title="새로고침"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                프로젝트명
              </th>
              <th className="w-16 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PM
              </th>
              <th className="w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                기간
              </th>
              <th className="w-40 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task 현황
              </th>
              <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                참여자
              </th>
              <th className="w-20 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                진행률
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProjects.map((project) => {
              const statusStyle = getStatusStyle(project);
              const progress = getProgressPercentage(project);
              const isParticipating = isUserParticipating(project);
              
              return (
                <tr 
                  key={project.id}
                  onClick={() => {
                    if (onProjectSelect) {
                      onProjectSelect(project);
                    } else {
                      // 프로젝트 상세 페이지로 이동
                      router.push(`/projects/${project.id}`);
                    }
                  }}
                  className={`transition-colors ${
                    isParticipating 
                      ? 'hover:bg-gray-50 cursor-pointer bg-white' 
                      : 'hover:bg-yellow-50 cursor-pointer bg-yellow-50/30'
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          isParticipating 
                            ? 'bg-blue-100' 
                            : 'bg-yellow-100'
                        }`}>
                          <span className={`text-sm font-medium ${
                            isParticipating 
                              ? 'text-blue-600' 
                              : 'text-yellow-600'
                          }`}>
                            {isParticipating ? project.name.charAt(0) : '👁️'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {project.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {project.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{project.pmName}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {project.startMonth} ~ {project.endMonth}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex space-x-1 flex-wrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        대기 {project.waitingTasks || 0}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        진행 {project.inProgressTasks || 0}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        완료 {project.completedTasks || 0}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {(() => {
                        // 모든 멤버를 하나의 배열로 합치기
                        const allMembers = [
                          ...(project.frontendMembers || []).map(id => ({ id, role: 'F', color: 'bg-purple-100 text-purple-800' })),
                          ...(project.backendMembers || []).map(id => ({ id, role: 'B', color: 'bg-indigo-100 text-indigo-800' })),
                          ...(project.designerMembers || []).map(id => ({ id, role: 'D', color: 'bg-pink-100 text-pink-800' })),
                          ...(project.uxMembers || []).map(id => ({ id, role: '기', color: 'bg-teal-100 text-teal-800' })),
                          ...(project.appMembers || []).map(id => ({ id, role: 'A', color: 'bg-orange-100 text-orange-800' })),
                          ...(project.aiMembers || []).map(id => ({ id, role: 'AI', color: 'bg-green-100 text-green-800' }))
                        ];
                        
                        // 최대 3명까지만 표시
                        const displayMembers = allMembers.slice(0, 3);
                        const remainingCount = allMembers.length - 3;
                        
                        return (
                          <>
                            {displayMembers.map((member, index) => {
                              const user = userMap.get(member.id);
                              return (
                                <span key={index} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${member.color}`}>
                                  {member.role}: {user?.name || `ID:${member.id}`}
                                </span>
                              );
                            })}
                            {remainingCount > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                +{remainingCount}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isParticipating ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        <div className={`w-2 h-2 ${statusStyle.dot} rounded-full mr-1.5`}></div>
                        {statusStyle.label}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1.5"></div>
                        미참여
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{progress}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">프로젝트가 없습니다</h3>
          <p className="text-gray-500">새 프로젝트를 생성해보세요.</p>
        </div>
      )}

    </div>
  );
}
