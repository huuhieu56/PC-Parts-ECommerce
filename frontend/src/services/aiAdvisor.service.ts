import type { CompatibilityIssue } from '../pages/BuildPC/types';
import type { Product } from '../types/product.types';

export interface AdvisorPartPayload {
  key: string;
  product_id: number;
  name: string;
  category_name?: string;
  price: number;
  specifications: Record<string, unknown>;
  attributes?: Record<string, unknown>;
}

export interface AdvisorRequest {
  parts: AdvisorPartPayload[];
  issues: CompatibilityIssue[];
}

export interface AdvisorResponse {
  advice: string[];
  summary?: string;
  compatibility_score?: number;
  bottleneck_analysis?: string;
}

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
};

const provider = (import.meta.env.VITE_PC_ADVISOR_PROVIDER as string | undefined)?.toLowerCase() || 'gemini';
const customEndpoint = import.meta.env.VITE_PC_ADVISOR_ENDPOINT as string | undefined;
const customApiKey = import.meta.env.VITE_PC_ADVISOR_API_KEY as string | undefined;

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined || 'YOUR_GEMINI_API_KEY';
const geminiModel = (import.meta.env.VITE_GEMINI_MODEL as string | undefined) || 'gemini-2.5-flash';
const geminiEndpoint = customEndpoint || `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent`;

const GEMINI_SYSTEM_PROMPT = `You are "PC Build Insight", an expert consultant for computer enthusiasts in Vietnam.
Your job is to analyse the provided PC parts and detected compatibility issues, then respond in JSON with a concise summary, compatibility score, bottleneck evaluation, and actionable advice.
Follow these rules:
1. Output must be valid JSON encoded in UTF-8 without markdown fences.
2. JSON structure: {"summary": string, "advice": string[], "compatibility_score": number, "bottleneck_analysis": string}.
3. "summary" <= 200 characters, Vietnamese, overview of the build quality.
4. Each item in "advice" <= 200 characters, Vietnamese, start with an imperative verb.
5. "compatibility_score" nằm trong khoảng 0-10 với 1 chữ số thập phân, đánh giá mức độ tương thích và cân bằng hiệu năng giữa các linh kiện, không tính tới yếu tố giá thành/performance-per-cost.
6. "bottleneck_analysis" phải là tiếng Việt, mô tả linh kiện đang giới hạn hiệu năng (ví dụ CPU hoặc GPU), ước tính tỷ lệ bottleneck nếu có dữ liệu, hoặc nêu rõ nếu thiếu thông tin.
7. Luôn nhắc tới linh kiện thiếu, cân bằng PSU/GPU, nhiệt độ, và các cảnh báo quan trọng.
8. Nếu dữ liệu thiếu, nêu giả định trước khi đưa ra khuyến nghị.`;

const buildGeminiUserContent = (payload: AdvisorRequest) => {
  const parts = payload.parts.map((item) => ({
    key: item.key,
    product_id: item.product_id,
    name: item.name,
    category_name: item.category_name,
    price: item.price,
    specifications: item.specifications,
    attributes: item.attributes,
  }));

  return {
    role: 'user',
    parts: [
      {
        text: [
          '### Build parts (JSON)',
          JSON.stringify(parts, null, 2),
          '### Compatibility issues (JSON)',
          JSON.stringify(payload.issues, null, 2),
        ].join('\n'),
      },
    ],
  };
};

const buildGeminiRequestBody = (payload: AdvisorRequest) => ({
  system_instruction: {
    parts: [{ text: GEMINI_SYSTEM_PROMPT }],
  },
  contents: [buildGeminiUserContent(payload)],
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.4,
    topP: 0.95,
    topK: 40,
  },
});

const parseGeminiResponse = (data: any): AdvisorResponse => {
  const candidates: GeminiCandidate[] = data?.candidates || [];
  const text = candidates
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text)
    .find((content) => typeof content === 'string');

  if (!text) {
    throw new Error('Gemini không trả về nội dung.');
  }

  try {
    const parsed = JSON.parse(text) as AdvisorResponse;
    if (!Array.isArray(parsed.advice)) {
      throw new Error('Trường advice phải là mảng.');
    }
    if (parsed.compatibility_score != null && typeof parsed.compatibility_score !== 'number') {
      throw new Error('compatibility_score phải là số.');
    }
    if (parsed.compatibility_score != null) {
      parsed.compatibility_score = Math.max(0, Math.min(10, parsed.compatibility_score));
    }
    return parsed;
  } catch (error) {
    throw new Error('Không thể phân tích phản hồi Gemini.');
  }
};

const callGemini = async (payload: AdvisorRequest): Promise<AdvisorResponse> => {
  if (!geminiApiKey) {
    throw new Error('Thiếu khóa Gemini API.');
  }

  const response = await fetch(`${geminiEndpoint}?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildGeminiRequestBody(payload)),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Yêu cầu Gemini thất bại.');
  }

  const data = await response.json();
  return parseGeminiResponse(data);
};

const callCustomEndpoint = async (payload: AdvisorRequest): Promise<AdvisorResponse> => {
  if (!customEndpoint) {
    throw new Error('AI advisor endpoint chưa được cấu hình.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (customApiKey) {
    headers['X-API-KEY'] = customApiKey;
  }

  const response = await fetch(customEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Yêu cầu AI advisor thất bại.');
  }

  const data = (await response.json()) as AdvisorResponse;
  if (!data || !Array.isArray(data.advice)) {
    throw new Error('Phản hồi AI advisor không hợp lệ');
  }

  if (data.compatibility_score != null) {
    const numericScore = Number(data.compatibility_score);
    data.compatibility_score = Number.isFinite(numericScore)
      ? Math.max(0, Math.min(10, numericScore))
      : undefined;
  }

  return data;
};

export const aiAdvisorService = {
  async analyzeBuild(payload: AdvisorRequest): Promise<AdvisorResponse> {
    if (provider === 'gemini') {
      return callGemini(payload);
    }
    return callCustomEndpoint(payload);
  },

  isConfigured(): boolean {
    if (provider === 'gemini') {
      return Boolean(geminiApiKey);
    }
    return Boolean(customEndpoint);
  },
};

export const buildAdvisorPayload = (parts: Record<string, Product | null>, issues: CompatibilityIssue[]): AdvisorRequest => {
  const entries = Object.entries(parts)
    .filter(([, product]) => Boolean(product))
    .map(([key, product]) => ({
      key,
      product_id: (product as Product).id,
      name: (product as Product).name,
      category_name: (product as Product).category?.name,
      price: (product as Product).price,
      specifications: (product as Product).specifications || {},
      attributes: (product as Product).attributes,
    }));

  return {
    parts: entries,
    issues,
  };
};
