'use client';

import { useState, useEffect, Suspense } from 'react';
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

function MintPageContent() {
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
      const decodedImage = decodeURIComponent(image);

      const fullImageUrl = decodedImage.startsWith('data:') 
        ? decodedImage 
        : decodedImage.startsWith('http') 
          ? decodedImage
          : `${window.location.origin}${decodedImage.startsWith('/') ? '' : '/'}${decodedImage}`;
          
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
    setImageUrl(''); // 파일 업로드 URL 초기화
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
      const formData = new FormData();
      
      if (imageFile) {
        console.log('Using uploaded file');
        formData.append('file', imageFile);
      } else if (imageUrl) {
        console.log('Fetching image from URL:', imageUrl);
        try {
          const response = await fetch(imageUrl, {
            mode: 'cors',
            cache: 'no-cache'
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }
          
          const blob = await response.blob();
          console.log('Image blob created:', blob.type, blob.size);
          
          const extension = imageUrl.split('.').pop()?.toLowerCase() || 'webp';
          formData.append('file', blob, `image.${extension}`);
        } catch (fetchError) {
          console.error('Error fetching image:', fetchError);
          throw new Error('이미지를 가져오는데 실패했습니다');
        }
      } else {
        throw new Error('이미지를 선택해주세요');
      }

      console.log('Uploading to Pinata...');
      const uploadResponse = await fetch('/api/pinata/upload', {
        method: 'POST',
        body: formData
      });

      const uploadData = await uploadResponse.json();
      console.log('Pinata response:', uploadData);
      
      if (!uploadData.success) {
        throw new Error('이미지 업로드 실패');
      }

      // IPFS URL 구성
      const ipfsUrl = uploadData.ipfsHash.startsWith('ipfs://') 
        ? uploadData.ipfsHash 
        : `ipfs://${uploadData.ipfsHash}`;
      console.log('IPFS URL:', ipfsUrl);

      const mintResponse = await fetch('/api/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metadata: {
            ...metadata,
            image: ipfsUrl  // IPFS URL 형식으로 변경
          }
        })
      });

      const mintData = await mintResponse.json();
      console.log('Mint response:', mintData);
      
      if (!mintData.success) {
        throw new Error('NFT 민팅 실패');
      }

      setAssetId(mintData.assetId);
    } catch (err: any) {
      console.error('Minting error:', err);
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
              <p className="text-sm text-purple-700 dark:text-purple-300">당신의 창작물이 고유한 가치를 인정받습니다</p>
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

export default function MintPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <MintPageContent />
    </Suspense>
  );
}
