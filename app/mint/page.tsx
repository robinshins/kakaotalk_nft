'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';

interface NFTMetadata {
  name: string;
  description: string;
  unitName: string;
  properties: {
    user: string;
    edition: number;
  };
}

export default function MintPage() {
  console.log('MintPage 렌더링');
  const searchParams = useSearchParams();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [metadata, setMetadata] = useState<NFTMetadata>({
    name: '',
    description: '',
    unitName: 'CHAT',
    properties: {
      user: '',
      edition: 1,
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<number | null>(null);

  useEffect(() => {
    console.log('useEffect 실행');
    const image = searchParams.get('image');
    const description = searchParams.get('description');

    if (image) {
      const fullImageUrl = image.startsWith('/') 
        ? `${window.location.origin}${image}`
        : image;
      console.log('이미지 URL 설정:', fullImageUrl);
      setImageUrl(fullImageUrl);
    }

    if (description) {
      console.log('설명 설정:', description);
      setMetadata(prev => ({
        ...prev,
        description: decodeURIComponent(description)
      }));
    }
  }, [searchParams]);

  const handleFileUpload = (file: File) => {
    setImageFile(file);
    setImageUrl(''); // 파일 업로드시 URL 초기화
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMint = async () => {
    try {
      if (!metadata.name.trim()) {
        throw new Error('NFT 이름을 입력해주세요');
      }

      setIsLoading(true);
      setError(null);

      // 이미지 처리
      let formData = new FormData();
      
      if (imageFile) {
        formData.append('file', imageFile);
      } else if (imageUrl) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        formData.append('file', blob);
      } else {
        throw new Error('이미지를 선택해주세요');
      }

      const uploadResponse = await fetch('/api/pinata/upload', {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadResponse.json();
      
      if (!uploadData.success) {
        throw new Error('이미지 업로드 실패');
      }

      const mintResponse = await fetch('/api/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metadata: {
            ...metadata,
            image: uploadData.ipfsHash
          }
        })
      });

      const mintData = await mintResponse.json();
      
      if (!mintData.success) {
        throw new Error('NFT 민팅 실패');
      }

      setAssetId(mintData.assetId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto pb-20">
        <h1 className="text-3xl font-bold mb-8">NFT 민팅</h1>
        
        <div className="mb-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 p-6 rounded-2xl border border-purple-100 dark:border-purple-800 shadow-lg">
          <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-3">
            당신의 작품을 NFT로 만들어보세요
          </h2>
          <p className="text-purple-800 dark:text-purple-200 mb-4 leading-relaxed">
            NFT는 디지털 작품을 영원히 보존하는 특별한 방법입니다. 
            마치 박물관의 작품처럼, 당신의 작품이 디지털 세상에 영구히 전시됩니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/50 dark:bg-white/5 p-4 rounded-xl">
              <div className="text-2xl mb-2">✨</div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">영원한 보존</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">변하지 않는 디지털 타임캡슐로 작품을 보존합니다</p>
            </div>
            <div className="bg-white/50 dark:bg-white/5 p-4 rounded-xl">
              <div className="text-2xl mb-2">🎨</div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">작품의 진정성</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">당신의 창작물이 가진 고유한 가치를 인정받습니다</p>
            </div>
            <div className="bg-white/50 dark:bg-white/5 p-4 rounded-xl">
              <div className="text-2xl mb-2">💫</div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">디지털 유산</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">디지털 세상에 영원히 남을 당신만의 작품</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              이미지 업로드
            </label>
            {imageUrl || imageFile ? (
              <div className="relative w-full aspect-square max-w-md">
                <img 
                  src={imageUrl || (imageFile ? URL.createObjectURL(imageFile) : '')} 
                  alt="Design preview" 
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <ImageUpload onUpload={handleFileUpload} />
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                NFT 이름 (1-32자)
              </label>
              <input
                type="text"
                name="name"
                value={metadata.name}
                onChange={handleMetadataChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                maxLength={32}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                설명
              </label>
              <textarea
                name="description"
                value={metadata.description}
                onChange={handleMetadataChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white h-24"
              />
            </div>
          </div>

          <button
            onClick={handleMint}
            disabled={isLoading || !metadata.name.trim()}
            className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 
                     text-black font-bold rounded-lg transition-colors"
          >
            {isLoading ? '민팅 중...' : 'NFT 민팅하기'}
          </button>

          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}

          {assetId && (
            <div className="space-y-2">
              <div className="text-green-500 text-sm">
                NFT가 성공적으로 민팅되었습니다! Asset ID: {assetId}
              </div>
              <a
                href={`https://testnet.explorer.perawallet.app/asset/${assetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 
                         text-white font-bold rounded-lg transition-colors text-center"
              >
                내 NFT 보러가기
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
