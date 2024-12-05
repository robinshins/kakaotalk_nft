import { NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 없습니다.' }, 
        { status: 400 }
      );
    }

    // File을 Buffer로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Pinata API 요청을 위한 formData 생성
    const pinataFormData = new FormData();
    pinataFormData.append('file', buffer, {
      filename: file.name,
      contentType: file.type,
    });

    // Pinata API 호출
    const pinataResponse = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      pinataFormData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PINATA_JWT_TOKEN}`,
          ...pinataFormData.getHeaders()
        },
        maxContentLength: Infinity,
        timeout: 60000 // 60초 타임아웃
      }
    );

    return NextResponse.json({ 
      success: true, 
      ipfsHash: pinataResponse.data.IpfsHash,
      url: `https://ipfs.io/ipfs/${pinataResponse.data.IpfsHash}`
    });

  } catch (error: any) {
    console.error('Upload error:', error.response?.data || error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: error.response?.data?.message || error.message || '파일 업로드 중 오류가 발생했습니다.' 
      }, 
      { status: 500 }
    );
  }
} 