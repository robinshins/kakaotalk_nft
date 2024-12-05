import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function streamToString(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    // Uint8Array 배열을 하나의 Uint8Array로 합치기
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    // base64로 변환
    return btoa(String.fromCharCode(...result));
  } finally {
    reader.releaseLock();
  }
}

export async function generateImage(prompt: string) {
  try {
    const output = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: prompt,
          disable_safety_checker: true,
          seed: 123456789
        }
      }
    );

    console.log('Raw output type:', typeof output);
    
    // ReadableStream 처리
    if (Array.isArray(output) && output[0] instanceof ReadableStream) {
      const stream = output[0];
      try {
        const base64Data = await streamToString(stream);
        console.log('Base64 data length:', base64Data.length);
        return `data:image/webp;base64,${base64Data}`;
      } catch (e) {
        console.error('Stream processing error:', e);
        throw new Error('이미지 스트림 처리 중 오류가 발생했습니다.');
      }
    }

    // 다른 형식의 응답 처리
    if (Array.isArray(output) && output.length > 0) {
      return output[0];
    }
    if (typeof output === 'string') {
      return output;
    }
    if (typeof output === 'object' && output !== null && 'url' in output) {
      return output.url;
    }

    console.error('Unexpected output format:', output);
    throw new Error('이미지 URL을 추출할 수 없습니다.');
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
} 