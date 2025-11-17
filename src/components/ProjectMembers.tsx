'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Member {
  id: number;
  name: string;
  position: string;
  imageUrl?: string;
  currentTasks?: {
    id: number;
    title: string;
    status: '대기' | '진행중' | '완료' | '보류';
  }[];
}

type Role = 'PM' | 'Frontend' | 'Backend' | 'Designer' | 'ux' | 'App' | 'AI';

interface ProjectMembersProps {
  projectId: number;
  frontendMembers?: number[];
  backendMembers?: number[];
  designerMembers?: number[];
  uxMembers?: number[];
  appMembers?: number[];
  aiMembers?: number[];
  pmId?: number;
}

export default function ProjectMembers({
  projectId,
  frontendMembers = [],
  backendMembers = [],
  designerMembers = [],
  uxMembers = [],
  appMembers = [],
  aiMembers = [],
  pmId,
}: ProjectMembersProps) {
  const [members, setMembers] = useState<Record<Role, Member[]>>({
    PM: [],
    Frontend: [],
    Backend: [],
    Designer: [],
    ux: [],
    App: [],
    AI: [],
  });

  console.log('ProjectMembers props:', {
    projectId,
    frontendMembers,
    backendMembers,
    designerMembers,
    uxMembers,
    appMembers,
    aiMembers,
    pmId
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // PM 정보 가져오기
        if (pmId) {
          const pmResponse = await fetch(`/api/users/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: [pmId] }),
          });
          const pmResult = await pmResponse.json();
          if (pmResult.success) {
            setMembers(prev => ({ ...prev, PM: pmResult.data }));
          }
        }

        // 모든 멤버 ID 수집
        const allMemberIds = [
          ...frontendMembers,
          ...backendMembers,
          ...designerMembers,
          ...uxMembers,
          ...appMembers,
          ...aiMembers,
        ].filter(Boolean);

        if (allMemberIds.length === 0) {
          setLoading(false);
          return;
        }

        // 모든 멤버 정보 가져오기
        const membersResponse = await fetch(`/api/users/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: allMemberIds }),
        });

        const membersResult = await membersResponse.json();
        if (membersResult.success) {
          const memberInfo = membersResult.data;
          
          // 역할별로 멤버 분류
          const categorizedMembers = {
            PM: members.PM,
            Frontend: memberInfo.filter((m: Member) => frontendMembers.includes(m.id)),
            Backend: memberInfo.filter((m: Member) => backendMembers.includes(m.id)),
            Designer: memberInfo.filter((m: Member) => designerMembers.includes(m.id)),
            ux: memberInfo.filter((m: Member) => uxMembers.includes(m.id)),
            App: memberInfo.filter((m: Member) => appMembers.includes(m.id)),
            AI: memberInfo.filter((m: Member) => aiMembers.includes(m.id)),
          };

          setMembers(categorizedMembers);
        }

        try {
          // 각 멤버의 현재 작업 정보 가져오기
          const tasksResponse = await fetch(`/api/projects/${projectId}/tasks`);
          if (!tasksResponse.ok) {
            console.error('Tasks API error:', {
              status: tasksResponse.status,
              statusText: tasksResponse.statusText
            });
            throw new Error(`Tasks API error: ${tasksResponse.status}`);
          }
          const tasksResult = await tasksResponse.json();
          
          if (tasksResult.success) {
            const memberTasks: {
              id: number;
              title: string;
              status: '대기' | '진행중' | '완료' | '보류';
              assignee_id: number;
            }[] = tasksResult.data;
            
            // 멤버별 작업 정보 매핑
            setMembers(prev => {
              const newMembers = { ...prev };
              (Object.keys(newMembers) as Role[]).forEach(role => {
                newMembers[role] = newMembers[role].map(member => ({
                  ...member,
                  currentTasks: memberTasks
                    .filter(task => task.assignee_id === member.id)
                    .map(task => ({
                      id: task.id,
                      title: task.title,
                      status: task.status,
                    })),
                }));
              });
              return newMembers;
            });
          }
        } catch (error) {
          console.error('멤버 작업 정보 가져오기 에러:', error);
        }
      } catch (error) {
        console.error('멤버 정보 가져오기 에러:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [projectId]); // 의존성 배열을 projectId만으로 제한

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // 파트별 색상 매핑
  const getRoleColor = (role: string) => {
    const colors = {
      PM: 'bg-purple-50 border-purple-200 text-purple-800',
      Frontend: 'bg-blue-50 border-blue-200 text-blue-800',
      Backend: 'bg-green-50 border-green-200 text-green-800',
      Designer: 'bg-pink-50 border-pink-200 text-pink-800',
      ux: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      App: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      AI: 'bg-orange-50 border-orange-200 text-orange-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  // 파트별 아이콘 매핑
  const getRoleIcon = (role: string) => {
    const icons = {
      PM: '👑',
      Frontend: '💻',
      Backend: '⚙️',
      Designer: '🎨',
      ux: '📋',
      App: '📱',
      AI: '🤖',
    };
    return icons[role as keyof typeof icons] || '👤';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(members).map(([role, roleMembers]) => 
        roleMembers.map((member) => (
          <div
            key={`${role}-${member.id}`}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border ${getRoleColor(role)}`}
          >
            <span className="text-sm">{getRoleIcon(role)}</span>
            <div className="font-medium text-sm">{member.name}</div>
            <div className="text-xs opacity-75">({member.position})</div>
            {member.currentTasks && member.currentTasks.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs opacity-75">작업</span>
                <div className="flex gap-1">
                  <span className="text-xs font-semibold bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
                    대기 {member.currentTasks.filter(task => task.status === '대기').length}
                  </span>
                  <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                    진행 {member.currentTasks.filter(task => task.status === '진행중').length}
                  </span>
                  <span className="text-xs font-semibold bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                    완료 {member.currentTasks.filter(task => task.status === '완료').length}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}