'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project, UserSearchResult } from '@/types';
import UserAutocomplete from './UserAutocomplete';

interface ProjectCreateFormProps {
  onSuccess?: (project: Project) => void;
  onCancel?: () => void;
}

export default function ProjectCreateForm({ onSuccess, onCancel }: ProjectCreateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startMonth: '',
    endMonth: '',
    pmName: '',
    pmId: 0,
    frontendMembers: [] as number[],
    backendMembers: [] as number[],
    designerMembers: [] as number[],
    uxMembers: [] as number[],
    appMembers: [] as number[],
    aiMembers: [] as number[]
  });

  const [memberInputs, setMemberInputs] = useState({
    frontend: '',
    backend: '',
    designer: '',
    ux: '',
    app: '',
    ai: ''
  });

  const [memberData, setMemberData] = useState({
    frontend: [] as UserSearchResult[],
    backend: [] as UserSearchResult[],
    designer: [] as UserSearchResult[],
    ux: [] as UserSearchResult[],
    app: [] as UserSearchResult[],
    ai: [] as UserSearchResult[]
  });

  // 폼 데이터 업데이트
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 멤버 추가
  const addMember = (part: string, name: string) => {
    if (!name.trim()) return;
    
    const field = `${part}Members` as keyof typeof formData;
    const currentMembers = formData[field] as number[];
    
    // 이 함수는 더 이상 사용되지 않음 (UserAutocomplete 사용)
    // 입력 필드 초기화
    setMemberInputs(prev => ({ ...prev, [part]: '' }));
  };

  // 멤버 제거
  const removeMember = (part: string, index: number) => {
    const field = `${part}Members` as keyof typeof formData;
    const dataField = part as keyof typeof memberData;
    const currentMembers = formData[field] as number[];
    const currentData = memberData[dataField];
    
    setFormData(prev => ({
      ...prev,
      [field]: currentMembers.filter((_, i) => i !== index)
    }));

    setMemberData(prev => ({
      ...prev,
      [dataField]: currentData.filter((_, i) => i !== index)
    }));
  };

  // PM 선택
  const handlePMSelect = (user: UserSearchResult) => {
    setFormData(prev => ({
      ...prev,
      pmName: user.name,
      pmId: user.id
    }));
  };

  // 팀 멤버 선택
  const handleMemberSelect = (part: string, user: UserSearchResult) => {
    const field = `${part}Members` as keyof typeof formData;
    const dataField = part as keyof typeof memberData;
    
    // 이미 추가된 멤버인지 확인
    const currentMembers = formData[field] as number[];
    if (currentMembers.includes(user.id)) {
      return; // 이미 추가된 멤버는 무시
    }

    setFormData(prev => ({
      ...prev,
      [field]: [...currentMembers, user.id]
    }));

    setMemberData(prev => ({
      ...prev,
      [dataField]: [...prev[dataField], user]
    }));

    // 입력 필드 초기화 (여러 명 선택이므로 계속 검색 가능)
    setMemberInputs(prev => ({ ...prev, [part]: '' }));
  };

  // 엔터키로 멤버 추가
  const handleMemberKeyPress = (part: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMember(part, memberInputs[part as keyof typeof memberInputs]);
    }
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '프로젝트명을 입력해주세요.';
    }

    if (!formData.startMonth) {
      newErrors.startMonth = '시작 월을 선택해주세요.';
    }

    if (!formData.endMonth) {
      newErrors.endMonth = '종료 월을 선택해주세요.';
    }

    if (formData.startMonth && formData.endMonth && formData.startMonth >= formData.endMonth) {
      newErrors.endMonth = '종료 월은 시작 월보다 늦어야 합니다.';
    }

    if (!formData.pmName.trim()) {
      newErrors.pmName = 'PM 이름을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          startMonth: formData.startMonth,
          endMonth: formData.endMonth,
          pmId: formData.pmId,
          pmName: formData.pmName,
          frontendMembers: memberData.frontend.map(member => member.id),
          backendMembers: memberData.backend.map(member => member.id),
          designerMembers: memberData.designer.map(member => member.id),
          uxMembers: memberData.ux.map(member => member.id),
          appMembers: memberData.app.map(member => member.id),
          aiMembers: memberData.ai.map(member => member.id)
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (onSuccess) {
          onSuccess(result.data);
        } else {
          router.push('/');
        }
      } else {
        setErrors({ submit: result.error || '프로젝트 생성에 실패했습니다.' });
      }
    } catch (error) {
      console.error('프로젝트 생성 에러:', error);
      setErrors({ submit: '프로젝트 생성 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  // 월 옵션 생성 (현재 월부터 12개월 후까지)
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const value = `${year}-${month}`; // YYYY-MM 형식
      const label = `${year}년 ${date.getMonth() + 1}월`;
      options.push({ value, label });
    }
    
    return options;
  };

  // 종료 월 옵션 생성 (현재 월부터 36개월 후까지)
  const generateEndMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 36; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const value = `${year}-${month}`; // YYYY-MM 형식
      const label = `${year}년 ${date.getMonth() + 1}월`;
      options.push({ value, label });
    }
    
    return options;
  };

  const monthOptions = generateMonthOptions();
  const endMonthOptions = generateEndMonthOptions();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">새 프로젝트 생성</h2>
          <p className="text-sm text-gray-500 mt-1">프로젝트 정보를 입력해주세요.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                프로젝트명 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="프로젝트명을 입력하세요"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PM 이름 *
              </label>
              <UserAutocomplete
                value={formData.pmName}
                onChange={(value) => handleInputChange('pmName', value)}
                onSelect={handlePMSelect}
                placeholder="PM 이름을 검색하세요"
                error={errors.pmName}
                selectedUsers={formData.pmId ? [{ id: formData.pmId, name: formData.pmName, email: '', part: '', displayName: formData.pmName }] : []}
              />
              
              {/* 선택된 PM 표시 */}
              {formData.pmId && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    <span className="flex items-center space-x-2">
                      <span>{formData.pmName}</span>
                      <span className="text-xs opacity-75">(PM)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, pmName: '', pmId: 0 }));
                      }}
                      className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="PM 선택 취소"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              프로젝트 설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="프로젝트에 대한 설명을 입력하세요"
            />
          </div>

          {/* 기간 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작 월 *
              </label>
              <select
                value={formData.startMonth}
                onChange={(e) => handleInputChange('startMonth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startMonth ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">시작 월을 선택하세요</option>
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.startMonth && <p className="mt-1 text-sm text-red-600">{errors.startMonth}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료 월 *
              </label>
              <select
                value={formData.endMonth}
                onChange={(e) => handleInputChange('endMonth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.endMonth ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">종료 월을 선택하세요</option>
                {endMonthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.endMonth && <p className="mt-1 text-sm text-red-600">{errors.endMonth}</p>}
            </div>
          </div>

          {/* 팀 멤버 */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">팀 멤버</h3>
            
            {[
              { key: 'frontend', label: 'Frontend', bgColor: 'bg-purple-100', textColor: 'text-purple-800', borderColor: 'border-purple-200' },
              { key: 'backend', label: 'Backend', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800', borderColor: 'border-indigo-200' },
              { key: 'designer', label: 'Designer', bgColor: 'bg-pink-100', textColor: 'text-pink-800', borderColor: 'border-pink-200' },
              { key: 'ux', label: '기획', bgColor: 'bg-teal-100', textColor: 'text-teal-800', borderColor: 'border-teal-200' },
              { key: 'app', label: 'App', bgColor: 'bg-blue-100', textColor: 'text-blue-800', borderColor: 'border-blue-200' },
              { key: 'ai', label: 'AI', bgColor: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-200' }
            ].map(({ key, label, bgColor, textColor, borderColor }) => (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {label} 팀
                </label>
                <UserAutocomplete
                  value={memberInputs[key as keyof typeof memberInputs]}
                  onChange={(value) => setMemberInputs(prev => ({ ...prev, [key]: value }))}
                  onSelect={(user) => handleMemberSelect(key, user)}
                  placeholder={`${label} 팀원을 검색하세요`}
                  selectedUsers={memberData[key as keyof typeof memberData]}
                  allowMultiple={true}
                />
                
                {/* 멤버 목록 */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {memberData[key as keyof typeof memberData].map((member, index) => (
                    <span
                      key={member.id}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor} border ${borderColor}`}
                    >
                      <span className="flex items-center space-x-2">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-xs opacity-75 font-normal">({member.part})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMember(key, index)}
                        className="ml-2 text-gray-500 hover:text-red-500 transition-colors"
                        title="제거"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 에러 메시지 */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel || (() => router.back())}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '생성 중...' : '프로젝트 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
