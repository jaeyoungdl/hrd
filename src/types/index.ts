// NextAuth 타입 확장
declare module 'next-auth' {
  interface User {
    position?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      position?: string;
    };
  }
}

// 업무 요청 관련 타입들
export interface WorkRequest {
  id: string;
  번호: string;
  분사명: string;
  회사: string;
  요청일: string;
  원료보정일: string;
  담당MD: string;
  요청자: string;
  업무명: string;
  요청내용: string;
  작업상황: string;
  요청자URL: string;
  메모: string;
  진행상태: string;
  신청요청_디자인시작일: string;
  신청요청_디자인완료일: string;
  디자이너배정: string;
  검수완료: number;
  공수: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 사용자 타입
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'designer' | 'user';
  department?: string;
  position?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 사용자 검색 결과 타입
export interface UserSearchResult {
  id: number;
  name: string;
  email: string;
  part: string;
  displayName: string;
}

// 진행 상태 타입
export type ProgressStatus = '대기' | '진행중' | '검수완료' | '완료' | '취소';

// 회사/분사 타입
export type Company = 'HomePlus' | 'NSmall' | 'GHS' | 'M영업기획팀';

// 프로젝트 관련 타입
export interface Project {
  id: number;
  name: string;
  description?: string;
  startMonth: string; // YYYY-MM 형식
  endMonth: string;   // YYYY-MM 형식
  pmId: number;
  pmName: string;
  createdAt: Date;
  updatedAt: Date;
  // Task 통계 필드들
  taskCount?: number;
  waitingTasks?: number;
  inProgressTasks?: number;
  completedTasks?: number;
  pendingTasks?: number;
  // 멤버 필드들
  frontendMembers: number[];
  backendMembers: number[];
  designerMembers: number[];
  uxMembers: number[];
  appMembers: number[];
  aiMembers: number[];
}

// Task 관련 타입
export type ProjectPart = 'frontend' | 'backend' | 'designer' | '기획' | 'app' | 'ai';
export type TaskCategory = '개발' | '분석/설계';
export type TaskStatus = '대기' | '진행중' | '완료' | '보류';

export interface Task {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  month: string;
  category: TaskCategory;
  part: ProjectPart;
  assigneeId: number;
  assigneeName: string;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  pmConfirmed: boolean;
  pmConfirmedDate?: string;
  createdAt: Date;
  updatedAt: Date;
  // 프로젝트 정보 (JOIN으로 가져옴)
  projectName?: string;
  pmName?: string;
  startMonth?: string;
  endMonth?: string;
}

// 필터 옵션
export interface FilterOptions {
  회사?: Company;
  디자이너?: string;
  진행상태?: ProgressStatus;
  요청일시작?: string;
  요청일종료?: string;
  // Task 필터 옵션들
  part?: ProjectPart;
  category?: TaskCategory;
  status?: TaskStatus;
  month?: string;
  assignee?: string;
}
