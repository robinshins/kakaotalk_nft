'use client';

import { useState, useEffect } from 'react';
import algosdk from 'algosdk'; // Algorand SDK import
import Image from 'next/image'; // Next.js Image component

interface ImageItem {
  id: number;
  title: string;
  user: string;
  url: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const walletAddress = 'WBXMJHVQ7SHYMIN6KTQC2GRHOOPXLGH3GT46A6U7PUNJBT4EZ3BBXZUMV4'; // 지갑 주소를 여기에 입력하세요

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
                title: assetInfo.params.name || 'Untitled NFT',
                user: walletAddress,
                url: imageUrl,
              };
            } catch (error) {
              console.error(`Error fetching asset ${asset['asset-id']}:`, error);
              return null;
            }
          })
        );

        // 유효한 이미지만 필터링
        setImages(imageItems.filter((item): item is ImageItem => item !== null));
      } catch (error) {
        console.error('Error fetching assets:', error);
      }
    }

    fetchAssets();
  }, []);

  return (
    <div className="container px-4 sm:px-6 py-8 mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">이미지 갤러리</h1>
        <p className="text-sm text-muted-foreground">Total {images.length.toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {images
          .sort((a, b) => Number(BigInt(b.id) - BigInt(a.id))) // 최신순 정렬
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
                onError={(e: any) => {
                  e.target.src = '/placeholder-image.svg'; // 로딩 실패시 기본 이미지 표시
                }}
              />
            </div>
            <div className="px-0.5">
              <h3 className="font-semibold text-foreground truncate">{image.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{image.user}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 