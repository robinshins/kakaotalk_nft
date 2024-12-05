import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Claude from '@anthropic-ai/sdk';
import { generateImage } from '@/utils/imageGenerator';
import { jsonrepair } from 'jsonrepair';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const claude = new Claude({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

// 텍스트를 적절한 길이로 자르는 함수
function truncateText(text: string, maxLength: number = 100000): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "\n... (텍스트가 너무 길어 일부가 생략되었습니다)";
}

// 날짜/시간 형식 정리를 위한 함수 추가
function cleanChatData(text: string): string {
  // 날짜 구분선은 유지 (예: "2024년 8월 10일 토요일")
  // 각 메시지의 날짜/시간 형식 제거 (예: "2024/08/10 23:03, " -> "")
  return text
    .replace(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}, ([^:]+) : /g, '$1 : ');
}

// 모델 선택 함수 수정
function selectModel(type: string): 'claude' | 'gpt' {
  const modelMapping = {
    'basic': 'gpt',
    'emotion': 'gpt',
    'memory': 'gpt',
    'past': 'gpt',
    'rap': 'gpt',
    'anniversary': 'gpt',
    'image': 'claude'  // 이미지 분석은 Claude 사용
  } as const;

  return modelMapping[type as keyof typeof modelMapping] || 'gpt';
}

// 대화 분석을 위한 타입 정의
type PromptElements = {
  symbols: string[];      // 상징적 요소
  emotions: string[];     // 감정 표현
  visualStyle: string[];  // 시각적 스타일
  colorPalette: string[]; // 색상 구성
  composition: string[];  // 구도/패턴
  artStyle: string[];     // 아트 스타일
}

const systemPrompt = `
당신은 대화 내용을 분석하여 NFT/커플티에 적합한 추상적 stable diffusion 이미지 프롬프트를 생성하는 전문가입니다.
AI로 무작위 생성할것이기 때문에 copyright 이슈는 없는 상황임.
다음 단계에 따라 대화를 분석하고 결과를 생성해주세요.

1단계: 대화 분석
대화에서 다음 요소들을 추출하세요:

A. 감정과 분위기
- 주요 감정 (기쁨, 설렘, 그리움, 따뜻함 등)
- 대화의 전반적인 톤과 분위기
- 특별한 순간이나 기억

B. 관계의 특성
- 관계의 깊이와 친밀도
- 공유하는 취미나 관심사
- 특별한 에피소드나 추억

2단계: 시각적 요소 선택

A. 상징적 요소 (인물 대신 사용할 오브젝트)
- 사랑: 하트, 인터로킹 서클, 무한대 심볼
- 우정: 연결된 별, 매듭 패턴, 나비
- 가족: 나무, 둥지, 연결된 링
- 성장: 새싹, 나선형, 달의 위상
- 희망: 등대, 새, 떠오르는 태양
- 행복: 무지개, 꽃, 빛나는 별

B. 아트 스타일 (NFT/커플티에 적합한 스타일)
- minimal geometric: 단순한 기하학적 형태
- flat design: 평면적이고 현대적인 디자인
- kawaii simple: 귀엽고 단순한 스타일
- line art: 섬세한 선화 스타일
- vector art: 깔끔한 벡터 그래픽
- pixel art: 레트로한 픽셀 스타일
- watercolor minimal: 섬세한 수채화 효과

C. 색상 팔레트
- pastel tones: 부드럽고 따뜻한 파스텔 톤
- monochromatic with accent: 단색 계열에 포인트 컬러
- duotone: 두 가지 색상의 조화
- gradient fade: 부드러운 그라데이션
- complementary colors: 보색 대비

D. 구도 및 패턴
- centered symmetrical: 중앙 대칭 구도
- circular pattern: 원형 패턴
- repeating elements: 반복되는 요소들
- golden ratio spiral: 황금비율 나선형
- tessellation pattern: 타일형 패턴

3단계: 프롬프트 생성 규칙

필수 포함 요소:
1. 선택된 상징적 요소 (2-3개)
2. 메인 아트 스타일
3. 색상 구성
4. 구도/패턴
5. 감정/분위기 표현

제한 사항:
- 인물 묘사 금지
- 텍스트나 문자 사용 금지
- 복잡한 배경 지양
- 작은 크기로 출력해도 식별 가능한 디자인
- explanation은실제 대화 내용과의 연관성에 초점
- JSON만 반환

4단계: 최종 출력 형식
결과는 반드시 다음 JSON 형식으로 반환하고 다른 말은 하지 말 것.

### output format:

{
  "prompt": "스테이블디퓨전용 영문 프롬프트",
  "explanation": "선택된 요소들과 대화 내용과의 연관성에 대한 한국말 설명"
}
`

async function fetchWithRetry(url: string, options: RequestInit, retries: number = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.error(`Fetch attempt ${i + 1} failed:`, error);
    }
  }
  throw new Error('최대 재시도 횟수를 초과했습니다.');
}

async function claudeWithRetry(messages: any, retries: number = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await claude.messages.create(messages);
      if (response.content) {
        return response;
      }
    } catch (error) {
      console.error(`Claude attempt ${i + 1} failed:`, error);
    }
  }
  throw new Error('Claude 최대 재시도 횟수를 초과했습니다.');
}

async function processClaudeResponse(chatData: string, retries: number = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const claudeResponse = await claude.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: chatData
          }
        ]
      });

      console.log(`Attempt ${i + 1} - Claude Raw Response:`, claudeResponse.content[0].text);

      const content = claudeResponse.content[0].text;
      const jsonString = content.replace(/```json\n|\n```/g, '').trim();
      
      try {
        const jsonResult = JSON.parse(jsonString);
        if (jsonResult.prompt && jsonResult.explanation) {
          return jsonResult;
        }
        console.log(`Attempt ${i + 1} - Required fields missing, retrying...`);
      } catch {
        try {
          const repairedJson = jsonrepair(jsonString);
          const jsonResult = JSON.parse(repairedJson);
          if (jsonResult.prompt && jsonResult.explanation) {
            return jsonResult;
          }
          console.log(`Attempt ${i + 1} - Required fields missing after repair, retrying...`);
        } catch (error) {
          console.error(`Attempt ${i + 1} - JSON parsing failed:`, error);
        }
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} - Claude API call failed:`, error);
    }
    
    // 마지막 시도가 아니면 잠시 대기
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // 점진적으로 대기 시간 증가
    }
  }
  throw new Error('모든 재시도 후에도 유효한 응답을 받지 못했습니다.');
}

export async function POST(request: Request) {
  try {
    console.log('OpenAI API Key format check:', {
      keyExists: !!process.env.OPENAI_API_KEY,
      keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 3)
    });
    
    const { type, chatData } = await request.json();
    
    if (type === 'image') {
      const modelType = selectModel(type);
      let jsonResult;

      if (modelType === 'claude') {
        jsonResult = await processClaudeResponse(chatData);
      } else {
        const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: chatData
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API 오류: ${response.status}`);
        }

        const gptData = await response.json();
        console.log('GPT Raw Response:', gptData.choices[0].message.content);

        try {
          const content = gptData.choices[0].message.content;
          const jsonString = content.replace(/```json\n|\n```/g, '').trim();
          console.log('Cleaned JSON string:', jsonString);
          
          try {
            jsonResult = JSON.parse(jsonString);
          } catch {
            const repairedJson = jsonrepair(jsonString);
            jsonResult = JSON.parse(repairedJson);
          }
        } catch (error) {
          console.error('JSON 파싱 오류:', error);
          console.log('파싱 시도한 내용:', gptData.choices[0].message.content);
          throw new Error('GPT 응답을 파싱할 수 없습니다.');
        }
      }

      if (!jsonResult.prompt || !jsonResult.explanation) {
        throw new Error('AI 응답에 필요 필드가 누락되었습니다.');
      }

      const imageOutput = await generateImage(jsonResult.prompt);
      if (!imageOutput) {
        console.error('이미지 생성 실패');
        throw new Error('이미지 생성에 실패했습니다.');
      }

      console.log('Generated image output:', imageOutput);

      return Response.json({ 
        result: {
          prompt: jsonResult.prompt,
          explanation: jsonResult.explanation,
          imageUrl: imageOutput
        }
      });
    }
    
    const cleanedText = cleanChatData(chatData);
    const truncatedChatData = truncateText(cleanedText);
    
    let prompt = '';
    switch (type) {
      case 'basic':
        prompt = `당신은 대화 분석 ��문가입니다. 
        아래 대화 내용을 바탕으로 대화 분석 리포트를 작성해주세요.
        대화 참여자들의 말투, 성격, 추억 등을 분석하는 것이 목표이며, 추억은 최대한 많 포함시키도록 합니다.
        실제 대화 내역이 포함되도록 하고, 대화 내역은 각색하지 않고 그대로 인용해주세요.`;
        break;
      case 'emotion':
        prompt = `대화에서 사용된 감정 표현들을 분석해세요.
        다음 감정들의 빈도를 분석해주세요: 기쁨, 슬픔, 놀람, 분노, 공포, 혐오
        각 감정이 드러난 대화 내용도 함께 인용해주세요.`;
        break;
      case 'memory':
        prompt = `채팅 내역을 바탕으로 각 월의 가장 메인이 되는 이벤트를 추출하고, 
        그 이벤트에 대한 간략한 설명을 작성해주세요.
        이때 나눴던 주요 대화 내용도 함께 인용해주세요.
        최소 6개 이상의 이트를 추출, 가능하면 각각 다른 에 있는 이벤트를 추출. 제일 예전 달부터 최근 달까지 순서대로 작성.
        각 이벤트들이 잘 구분되고 가독성이 좋도록 마크다운 형식으로 작성. 소제목은 볼드처리
        결과말고 다른 말은 하지 말 것.
        형식: 
        [년월] : \n
        [이벤트명 및 이벤트 간단한 설명] \n
        [나눴던 주요 대화 내용] \n
        `;
        break;
      case 'past':
        prompt = `당신은 전생 분석 전문가니다. 
        부된 채팅 내용을 탕으로 두 사람이 전생에 어떤 관계였을지 추측하고 이를 재미있는 이야기로 작성해주세요.
        전생은 사람이 닌 동식물이나 물체일 수도 있으니 자유롭게 상상.
        최소 100년 전을 상상하여 관계를 각색하고 밀접한 관계를 만들어주세요.
        전생에 어떤 관계였는지를 먼저 명확하게 밝히고 이야기를 시작하세요.
        마지막에 왜 이런 전생관계가 되었는지 첨부된 대화 내용을 바탕으로 간략하게 설명해주세요.
        이야기는 최소 5문단 이상으로 작성해주세요.`;
        break;
      case 'rap':
        prompt = `당신은 국내 최고의 힙합 프로듀서입니다.
        대화 내을 바탕으로 두 사람의 계와 특별했던 순간들을 담은
        랩 가사를 작성해주세요.
        후렴구를 포함하여 최소 3절 이상 작성해주세요.`;
        break;
      case 'anniversary':
        prompt = `당신은 기념일 생성 전문가입니다. 
        첨부된 채팅 내역을 바탕으로 두 사람에게 의미 있는 기념일을 만들어주세요.
        기념일의 날짜(월/일), 이유, 추천 이벤트, 그날 나눴던 대화 등을 포함해주세요.
        실제 대화 내용은 각색하지 말고 로 인용해주세요.`;
        break;
      default:
        return NextResponse.json({ error: '잘못된 분석 유형입니다.' }, { status: 400 });
    }

    try {
      const modelType = selectModel(type);
      let result;

      if (modelType === 'claude') {
        const claudeResponse = await claudeWithRetry({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4000,
          messages: [
            { role: "user", content: prompt + "\n\n" + truncatedChatData }
          ],
        });
        result = claudeResponse.content[0].text;
      } else {
        const openaiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: truncatedChatData }
          ],
          max_tokens: 5000,
        });
        result = openaiResponse.choices[0].message.content;
      }

      return NextResponse.json({ result });
    } catch (error: any) {
      if (error.code === 'context_length_exceeded') {
        return NextResponse.json({ 
          error: '대화 내용이 너무 깁니다. 더 짧은 대화를 선택해주세요.' 
        }, { status: 400 });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json({ 
      error: error.message || '분석 중 오류가 발생했습니다.' 
    }, { 
      status: 500 
    });
  }
} 