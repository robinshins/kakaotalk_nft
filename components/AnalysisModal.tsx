'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import './AnalysisModal.css';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string | {
    prompt: string;
    explanation: string;
    imageUrl: string;
  };
}

export default function AnalysisModal({ isOpen, onClose, title, content }: AnalysisModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const renderImage = (url: string | null | undefined) => {
    if (!url || imageError) {
      return (
        <div className="bg-gray-700 p-4 rounded text-center">
          <p className="text-gray-300">이미지를 불러올 수 없습니다.</p>
        </div>
      );
    }

    try {
      // 유효한 base64 문자열인지 확인
      const isBase64 = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(url);
      
      const imageUrl = url.startsWith('data:') 
        ? url 
        : isBase64 
          ? `data:image/webp;base64,${url}`
          : url;

      return (
        <div className="relative w-full aspect-square">
          <img
            src={imageUrl}
            alt="Generated Image"
            className="w-full h-auto rounded-lg object-contain"
            onError={(e) => {
              console.error('Image load error:', e);
              setImageError(true);
            }}
          />
        </div>
      );
    } catch (error) {
      console.error('Image render error:', error);
      return (
        <div className="bg-gray-700 p-4 rounded text-center">
          <p className="text-gray-300">이미지 형식이 올바르지 않습니다.</p>
        </div>
      );
    }
  };

  const handleMintNFT = async () => {
    if (typeof content !== 'string' && content.imageUrl) {
      try {
        // 이미지가 이미 URL인 경우 그대로 사용
        if (content.imageUrl.startsWith('http') || content.imageUrl.startsWith('/uploads/')) {
          const fullImageUrl = content.imageUrl.startsWith('http') 
            ? content.imageUrl 
            : `${window.location.origin}${content.imageUrl}`;
            
          const params = new URLSearchParams({
            image: fullImageUrl,
            name: '대화 분석 NFT',
            description: content.explanation || '',
            unitName: 'CHAT',
            returnUrl: window.location.pathname + window.location.search
          });

          router.push(`/mint?${params.toString()}`);
          return;
        }

        // base64 이미지인 경우 업로드
        const response = await fetch('/api/uploadImage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            image: content.imageUrl,
            fileName: 'analysis-image.webp'
          }),
        });

        if (!response.ok) {
          console.error('Upload failed:', await response.text());
          alert('이미지 업로드에 실패했습니다.');
          return;
        }

        const data = await response.json();
        const fullImageUrl = data.url.startsWith('http') 
          ? data.url 
          : `${window.location.origin}${data.url}`;
        
        const params = new URLSearchParams({
          image: fullImageUrl,
          name: '대화 분석 NFT',
          description: content.explanation || '',
          unitName: 'CHAT',
          returnUrl: window.location.pathname + window.location.search
        });

        router.push(`/mint?${params.toString()}`);
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  const renderContent = () => {
    if (typeof content === 'string') {
      return (
        <ReactMarkdown
          components={{
            h1: ({...props}) => <h1 className="text-2xl font-bold mb-4" {...props} />,
            h2: ({...props}) => <h2 className="text-xl font-bold mb-3" {...props} />,
            h3: ({...props}) => <h3 className="text-lg font-bold mb-2" {...props} />,
            p: ({...props}) => <p className="mb-4 text-gray-800" {...props} />,
            ul: ({...props}) => <ul className="list-disc pl-5 mb-4" {...props} />,
            ol: ({...props}) => <ol className="list-decimal pl-5 mb-4" {...props} />,
            li: ({...props}) => <li className="mb-1" {...props} />,
            strong: ({...props}) => <strong className="font-bold text-gray-900" {...props} />,
            em: ({...props}) => <em className="italic" {...props} />,
            blockquote: ({...props}) => (
              <blockquote className="border-l-4 border-gray-200 pl-4 mb-4 italic" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      );
    }

    return (
      <div className="space-y-4">
        {content.prompt && (
          <div className="bg-gray-700 p-4 rounded">
            <h3 className="text-lg font-semibold text-white mb-2">생성된 프롬프트</h3>
            <p className="text-gray-300">{content.prompt}</p>
          </div>
        )}
        {content.explanation && (
          <div className="bg-gray-700 p-4 rounded">
            <h3 className="text-lg font-semibold text-white mb-2">설명</h3>
            <p className="text-gray-300">{content.explanation}</p>
          </div>
        )}
        {content.imageUrl && (
          <div className="space-y-3">
            <div className="relative w-full aspect-square">
              {renderImage(content.imageUrl)}
            </div>
            
            {/* NFT 설명 섹션 */}
            <div className="bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
              <h3 className="text-lg font-bold text-amber-900 mb-2">
                특별 순간을 영원히 간직하세요
              </h3>
              <p className="text-sm text-amber-900 leading-relaxed mb-3">
                이 이미지는 여러분의 대화에서 발견된 특별한 감정을 AI가 예술적으로 표현한 것입니다. 
                NFT로 만들면 마치 타임캡슐처럼, 이 순간의 감정과 이야기가 디지털 세상에 영원히 새겨집니다. 
                시간이 흘러도 변하지 않는 추억으로 남겨보세요.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-amber-900">
                  <span className="text-lg">🎨</span>
                  <span>AI가 표현한 당신만의 특별한 순간</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-900">
                  <span className="text-lg">💝</span>
                  <span>영원히 간직하고 싶은 감정을 작품으로</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-900">
                  <span className="text-lg">✨</span>
                  <span>시간이 흘러도 변치 않는 디지털 타임캡슐</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleMintNFT}
              className="w-full py-3 px-6 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              NFT로 만들기
            </button>

            {/* 이미지 다운로드 버튼 추가 */}
            {content.imageUrl && (
              <a
                href={content.imageUrl}
                download="image.png"
                className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl text-center block mt-2"
              >
                이미지 다운로드
              </a>
            )}
        </div>
        )}
      </div>
    );
  };

  return (
    <div className="analysis-modal">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button onClick={onClose} className="close-button">
            ✕
          </button>
        </div>
        <div className="modal-content">
          <div className="content-section">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
} 