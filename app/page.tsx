'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import algosdk from 'algosdk';
import Link from 'next/link';

interface ImageItem {
  id: number;
  title: string;
  user: string;
  url: string;
}

export default function Home() {
  const [images, setImages] = useState<any[]>([]);
  const walletAddress = 'WBXMJHVQ7SHYMIN6KTQC2GRHOOPXLGH3GT46A6U7PUNJBT4EZ3BBXZUMV4';

  useEffect(() => {
    async function fetchAssets() {
      try {
        const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);
        const accountInfo = await algodClient.accountInformation(walletAddress).do();
        const assets = accountInfo.assets || accountInfo.createdAssets || [];

        const imageItems = await Promise.all(
          assets.map(async (asset: any) => {
            try {
              if (!asset['asset-id']) {
                console.warn('Invalid asset id:', asset);
                return null;
              }

              const assetId = asset['asset-id'];
              const assetInfo = await algodClient.getAssetByID(assetId).do();
              
              let imageUrl = assetInfo.params.url || '';
              if (imageUrl.startsWith('ipfs://')) {
                const ipfsHash = imageUrl.replace(/ipfs:\/\//g, '');
                if (ipfsHash) {
                  imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
                } else {
                  console.warn('Invalid IPFS URL:', imageUrl);
                  imageUrl = '/placeholder-image.svg';
                }
              } else if (!imageUrl) {
                imageUrl = '/placeholder-image.svg';
              }

              console.log('Processing URL:', imageUrl);

              return {
                id: assetId,
                title: assetInfo.params.name || 'NFT',
                user: walletAddress,
                url: imageUrl,
              };
            } catch (error) {
              console.error(`Error fetching asset ${asset['asset-id']}:`, error);
              return null;
            }
          })
        );

        setImages(imageItems.filter((item): item is ImageItem => item !== null));
      } catch (error) {
        console.error('Error fetching assets:', error);
      }
    }

    fetchAssets();
  }, []);

  return (
    <>
      {/* 메인 배너 */}
      <Link href="/analysis" className="block">
        <div className="relative w-full h-auto min-h-[16rem] bg-gradient-to-br from-[#FFF8E1] to-[#FFECB3] rounded-xl mb-8 overflow-hidden hover:shadow-lg transition-shadow duration-200">
          <div className="absolute inset-0 flex items-center p-4 sm:p-8">
            <div className="flex flex-col gap-2 sm:gap-3 max-w-[70%] sm:max-w-md">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-900">
                AI가 분석하는<br />
                우리들의 특별한 이야기
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-yellow-800">
                잊고 있던 추억을 되살리고, 숨겨진 감정을 발견하고,
                우리만의 특별한 순간을 예술 작품으로 만들어보세요.
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-yellow-100/50 rounded-full text-xs sm:text-sm text-yellow-900">
                  🎨 감정 분석
                </span>
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-yellow-100/50 rounded-full text-xs sm:text-sm text-yellow-900">
                  💫 추억 돌아보기
                </span>
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-yellow-100/50 rounded-full text-xs sm:text-sm text-yellow-900">
                  ✨ AI 아트 생성
                </span>
              </div>
            </div>
            <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2">
              <Image 
                src="/talk.png" 
                alt="KakaoTalk Icon" 
                width={80}
                height={80}
                className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] md:w-[120px] md:h-[120px] object-contain"
              />
            </div>
          </div>
        </div>
      </Link>

      {/* 최근 생성 섹션 */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">최근에 생성했어요!</h2>
          <Link 
            href="/gallery" 
            className="px-3 py-1 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200 flex items-center gap-1"
          >
            더보기 <span className="text-lg leading-none relative top-[1px]">→</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {images
            .sort((a, b) => Number(BigInt(b.id) - BigInt(a.id)))
            .slice(0, 4)
            .map((image) => (
            <div 
              key={image.id} 
              className="flex flex-col gap-3"
              onClick={() => window.open(`https://testnet.explorer.perawallet.app/asset/${image.id}`, '_blank')}
              style={{ cursor: 'pointer' }}
            >
              <div className="relative w-full h-64">
                <Image 
                  src={image.url} 
                  alt={image.title} 
                  fill 
                  priority
                  className="rounded-lg object-cover"
                  onError={(e) => {
                    console.error(`Failed to load image: ${image.url}`);
                    e.currentTarget.src = '/placeholder-image.svg';
                  }}
                />
              </div>
              <div className="px-0.5">
                <h3 className="font-semibold text-foreground truncate">{image.title}</h3>
                <p className="text-sm text-muted-foreground truncate">Created by You</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
