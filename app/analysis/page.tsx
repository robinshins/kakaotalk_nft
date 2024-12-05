'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import FileUpload from '@/components/FileUpload';
import AnalysisCard from '@/components/AnalysisCard';

const AnalysisModal = dynamic(() => import('@/components/AnalysisModal'), {
  ssr: false
});

export default function AnalysisPage() {
  const [chatData, setChatData] = useState<string>('');
  const [analysisResults, setAnalysisResults] = useState<{ [key: string]: string }>({});
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // 중복된 useEffect 제거하고 하나만 유지
  useEffect(() => {
    // 브라우저를 처음 열었을 때만 데이터를 복원
    const isFirstVisit = !sessionStorage.getItem('visited');
    if (isFirstVisit) {
      const savedChatData = localStorage.getItem('chatData');
      if (savedChatData) {
        setChatData(savedChatData);
      }
      sessionStorage.setItem('visited', 'true');
    }

    // 컴포넌트 언마운트시 localStorage 초기화
    return () => {
      localStorage.removeItem('chatData');
      sessionStorage.removeItem('visited');
    };
  }, []);

  const handleFileUpload = (content: string) => {
    // 날짜/시간 형식 정리
    const cleanedContent = content.replace(
      /\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}, ([^:]+) : /g, 
      '$1 : '
    );
    
    setChatData(cleanedContent);
    localStorage.setItem('chatData', cleanedContent);
  };

  const analysisTypes = [
    {
      title: '기본 분석',
      description: '카카오톡 대화를 분석하여 관계 리포트를 뽑아드려요',
      type: 'basic'
    },
    {
      title: '감정 단어 분석하기',
      description: '둘 사이에 어떤 감정 단어가 가장 많이 오고 갔을까요?',
      type: 'emotion'
    },
    {
      title: '예전 추억 돌아보기',
      description: '현생에 지쳐 잊고 살아왔던 둘만의 추억을 돌아봐요',
      type: 'memory'
    },
    {
      title: '전생 관계 분석',
      description: '우린 전생에 어떤 사이였길래 이렇게 다시 만났을까요?',
      type: 'past'
    },
    {
      title: '랩 가사 작성',
      description: '신나는 비트에서 느껴지는 우리의 힙한 관계!',
      type: 'rap'
    },
    {
      title: '기념일 생성',
      description: '우리 둘만의 특별한 기념일을 만들어봐요',
      type: 'anniversary'
    },
    {
      title: '우리만의 이미지 만들기',
      description: '대화 내용을 바탕으로 AI가 우리만의 특별한 이미지를 그려드려요',
      type: 'image'
    }
  ];

  const handleAnalysis = async (type: string) => {
    // 이미 분석된 결과가 있는 경우
    if (analysisResults[type] && analysisResults[type] !== "분석 중...") {
      setActiveModal(type);
      return;
    }

    // 모달을 먼저 열고, 초기 상태 설정
    setActiveModal(type);
    setAnalysisResults(prev => ({ ...prev, [type]: "분석 중..." }));

    try {
      const maxLength = 200000;
      let result = '';

      if (type === 'memory' && chatData.length > maxLength) {
        const firstHalf = chatData.slice(0, 100000);
        const secondHalf = chatData.slice(-100000);

        const [firstResponse, secondResponse] = await Promise.all([
          fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              type, 
              chatData: firstHalf + "\n\n... (중간 대화 내용은 생략되었습니다)",
              part: 'first'
            })
          }),
          fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              type, 
              chatData: secondHalf + "\n\n... (이전 대화 내용은 생략되었습니다)",
              part: 'second'
            })
          })
        ]);

        const [firstData, secondData] = await Promise.all([
          firstResponse.json(),
          secondResponse.json()
        ]);

        if (!firstResponse.ok || !secondResponse.ok) {
          throw new Error(firstData.error || secondData.error || '분석 중 오류가 발생했습니다.');
        }

        result = `\n${firstData.result}\n\n${secondData.result}`;
      } else {
        const truncatedChat = chatData.slice(-100000);
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type, 
            chatData: truncatedChat + (chatData.length > 100000 ? "\n\n... (이전 대화 내용은 생략되었습니다)" : "")
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '분석 중 오류가 발생했습니다.');
        }

        result = data.result;
      }

      setAnalysisResults(prev => ({ ...prev, [type]: result }));
    } catch (error: any) {
      console.error('Analysis error:', error);
      setAnalysisResults(prev => ({ 
        ...prev, 
        [type]: error.message || '분석 중 오류가 발생했습니다. 다시 시도해주세요.' 
      }));
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto h-full">
       <div className="max-w-6xl mx-auto pb-20">
        <h1 className="text-3xl font-bold mb-8 text-white">카카오톡 대화 분석</h1>
        
        <div className="space-y-2 mb-4 text-gray-300 text-sm">
          <p>
            🔒 첨부된 대화 내역은 분석 목적으로만 사용되며 별도로 저장되지 않습니다.
          </p>
          <p>
            💡 카카오톡 대화 내보내기가 처음이신가요?{' '}
            <a 
              href="https://cs.kakao.com/helps_html/470002560?locale=ko" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              안내 바로가기
            </a>
          </p>
        </div>
        
        <FileUpload onUpload={handleFileUpload} />
        
        {chatData && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-white">업로드된 대화 내용</h2>
            <div className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm text-gray-300">
              {chatData}
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysisTypes.map((analysis) => (
            <AnalysisCard
              key={analysis.type}
              title={analysis.title}
              description={analysis.description}
              onClick={() => handleAnalysis(analysis.type)}
              disabled={!chatData}
            />
          ))}
        </div>

        {activeModal && (
          <AnalysisModal
            isOpen={true}
            onClose={() => setActiveModal(null)}
            title={analysisTypes.find(a => a.type === activeModal)?.title || ''}
            content={analysisResults[activeModal] || ''}
          />
        )}
      </div>
    </div>
  );
} 