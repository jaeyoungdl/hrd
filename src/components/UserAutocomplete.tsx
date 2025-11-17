'use client';

import { useState, useEffect, useRef } from 'react';
import { UserSearchResult } from '@/types';

interface UserAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (user: UserSearchResult) => void;
  placeholder: string;
  part?: string; // 특정 파트 필터링
  className?: string;
  error?: string;
  selectedUsers?: UserSearchResult[]; // 이미 선택된 사용자들
  allowMultiple?: boolean; // 여러 명 선택 허용 여부
}

export default function UserAutocomplete({ 
  value, 
  onChange, 
  onSelect, 
  placeholder, 
  part,
  className = '',
  error,
  selectedUsers = [],
  allowMultiple = false
}: UserAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // 사용자 검색
  const searchUsers = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    
    try {
      const params = new URLSearchParams({ q: searchTerm });
      // part 필터링 제거 - 모든 사용자 검색 가능

      const response = await fetch(`/api/users/search?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setSuggestions(result.data);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('사용자 검색 에러:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // 디바운스된 검색
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, part]);

  // 여러 명 선택이 허용되고 입력값이 비어있을 때 이전 검색 결과 유지
  useEffect(() => {
    if (allowMultiple && value === '' && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [value, allowMultiple, suggestions.length]);

  // 외부 클릭 시 제안 목록 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectUser(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 사용자 선택
  const handleSelectUser = (user: UserSearchResult) => {
    onSelect(user);
    // 여러 명 선택이 허용되면 제안 목록을 유지하되, 입력 필드가 포커스되어 있을 때만
    if (!allowMultiple) {
      setShowSuggestions(false);
    } else {
      // 입력 필드가 포커스되어 있으면 제안 목록 유지
      if (inputRef.current === document.activeElement) {
        setShowSuggestions(true);
      }
    }
    setSelectedIndex(-1);
  };

  // 입력 변경
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 여러 명 선택이 허용되지 않고 선택된 사용자가 있으면 입력을 막음
    if (!allowMultiple && selectedUsers.length > 0) {
      return;
    }
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          } else if (allowMultiple && value.length >= 2) {
            // 여러 명 선택이 허용되고 입력값이 있으면 검색 실행
            searchUsers(value);
          }
        }}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        } ${!allowMultiple && selectedUsers.length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        placeholder={!allowMultiple && selectedUsers.length > 0 ? '선택된 사용자가 있습니다' : placeholder}
        autoComplete="off"
        disabled={!allowMultiple && selectedUsers.length > 0}
      />
      
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions
            .filter(user => !selectedUsers.some(selected => selected.id === user.id))
            .map((user, index) => (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`px-3 py-2 transition-colors ${
                  index === selectedIndex
                    ? 'bg-blue-50 text-blue-700 cursor-pointer'
                    : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.part}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
