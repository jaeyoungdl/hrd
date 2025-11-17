'use client';

import { useState, useEffect } from 'react';
import ProjectMembers from '@/components/ProjectMembers';

interface Project {
  id: number;
  name: string;
  description: string;
  startMonth: string;
  endMonth: string;
  pmId: number;
  pmName: string;
  frontendMembers: number[];
  backendMembers: number[];
  designerMembers: number[];
  uxMembers: number[];
  appMembers: number[];
  aiMembers: number[];
  taskCount: number;
  completedTasks: number;
  waitingTasks: number;
  inProgressTasks: number;
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`);
        const result = await response.json();
        if (result.success) {
          setProject(result.data);
        }
      } catch (error) {
        console.error('프로젝트 정보 가져오기 에러:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.id]);

  if (loading) {
    return (
      <div className="animate-pulse p-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">프로젝트를 찾을 수 없습니다</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 프로젝트 기본 정보 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
        <p className="text-gray-600 mb-4">{project.description}</p>
        <div className="flex space-x-4 text-sm text-gray-500">
          <span>기간: {project.startMonth} ~ {project.endMonth}</span>
          <span>PM: {project.pmName}</span>
        </div>
      </div>

      {/* 프로젝트 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">전체 작업</div>
          <div className="mt-1 text-2xl font-semibold">{project.taskCount || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">진행 중</div>
          <div className="mt-1 text-2xl font-semibold text-blue-600">{project.inProgressTasks || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">완료</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">{project.completedTasks || 0}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm font-medium text-gray-500">대기</div>
          <div className="mt-1 text-2xl font-semibold text-yellow-600">{project.waitingTasks || 0}</div>
        </div>
      </div>

      {/* 멤버 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">프로젝트 멤버</h2>
        </div>
        <div className="p-4">
          <ProjectMembers
            projectId={project.id}
            pmId={project.pmId}
            frontendMembers={project.frontendMembers || []}
            backendMembers={project.backendMembers || []}
            designerMembers={project.designerMembers || []}
            uxMembers={project.uxMembers || []}
            appMembers={project.appMembers || []}
            aiMembers={project.aiMembers || []}
          />
        </div>
      </div>

      {/* Task 현황 */}
      <div className="bg-white rounded-lg shadow mt-8">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Task 현황</h2>
        </div>
        <div className="p-4">
          {/* Task 목록은 나중에 구현 */}
        </div>
      </div>
    </div>
  );
}