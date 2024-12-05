import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { image } = data;

    if (!image) {
      return NextResponse.json(
        { error: '이미지가 제공되지 않았습니다.' }, 
        { status: 400 }
      );
    }

    // base64 이미지 데이터 추출
    const base64Data = image.split(',')[1];
    if (!base64Data) {
      return NextResponse.json(
        { error: '잘못된 이미지 형식입니다.' },
        { status: 400 }
      );
    }

    // uploads 디렉토리 생성
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const imageBuffer = Buffer.from(base64Data, 'base64');
    const imageName = `${uuidv4()}.webp`;
    const imagePath = path.join(uploadDir, imageName);

    fs.writeFileSync(imagePath, imageBuffer);

    return NextResponse.json({ 
      success: true,
      url: `/uploads/${imageName}` 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 