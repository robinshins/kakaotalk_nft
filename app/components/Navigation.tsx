'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <nav className="flex gap-4 mb-6">
        <div className="px-4 py-2 rounded-full text-gray-600">홈</div>
        <div className="px-4 py-2 rounded-full text-gray-600">대화분석</div>
        <div className="px-4 py-2 rounded-full text-gray-600">이미지갤러리</div>
        <div className="px-4 py-2 rounded-full text-gray-600">NFT민팅</div>
      </nav>
    );
  }

  return (
    <nav className="flex gap-4 mb-6">
      <Link 
        href="/" 
        className={`px-4 py-2 rounded-full ${
          pathname === '/' ? 'bg-yellow-400 font-bold' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        홈
      </Link>
      <Link 
        href="/analysis" 
        className={`px-4 py-2 rounded-full ${
          pathname === '/analysis' ? 'bg-yellow-400 font-bold' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        대화분석
      </Link>
      <Link 
        href="/gallery" 
        className={`px-4 py-2 rounded-full ${
          pathname === '/gallery' ? 'bg-yellow-400 font-bold' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        이미지갤러리
      </Link>
      <Link 
        href="/mint" 
        className={`px-4 py-2 rounded-full ${
          pathname === '/mint' ? 'bg-yellow-400 font-bold' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        NFT민팅
      </Link>
    </nav>
  );
} 