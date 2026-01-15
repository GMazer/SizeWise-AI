
import { BodyMeasurements, SizePrediction } from "../types";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const API_URL = "https://mavo-size-api.onrender.com";

export const predictSizeWithGemini = async (
  measurements: BodyMeasurements,
  useFullModel: boolean
): Promise<SizePrediction> => {
  try {
    // 1. GỌI PYTHON API: Để lấy Size chính xác (Logic toán học/Random Forest)
    // AI LLM giỏi văn nhưng đôi khi tính toán size cụ thể không ổn định bằng thuật toán chuyên biệt.
    const requestBody = {
      cao: parseFloat(measurements.height) || 0,
      nang: parseFloat(measurements.weight) || 0,
      nguc: parseFloat(measurements.bust) || 0,
      eo: parseFloat(measurements.waist) || 0,
      mong: parseFloat(measurements.hips) || 0,
    };

    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Lỗi kết nối Server: ${response.status}`);
    }

    const data = await response.json();
    
    const suggestedSize = data.size || data.prediction || "M"; 
    const confidence = data.confidence ? parseFloat(data.confidence) : 95;
    const isAmbiguous = data.is_ambiguous || false;
    const alternativeSize = data.alt_size || data.alternative_size || undefined;

    // 2. GỌI GEMINI API: Để sinh "Lời khuyên" và "Giải thích" (Creative Content)
    let explanation = "";
    let advice = "";

    try {
        // Cố gắng gọi Gemini để lấy nội dung xịn
        const geminiContent = await generateStylistAdvice(measurements, suggestedSize, alternativeSize, isAmbiguous);
        explanation = geminiContent.explanation;
        advice = geminiContent.advice;
    } catch (geminiError) {
        console.warn("Gemini Error, falling back to static text:", geminiError);
        // Fallback về text tĩnh nếu Gemini lỗi (hết quota, network, key invalid...)
        const resultStruct = { suggestedSize, alternativeSize, isAmbiguous, confidence };
        explanation = getStaticExplanation(resultStruct, measurements, useFullModel);
        advice = getStaticAdvice(suggestedSize);
    }

    return {
      suggestedSize,
      alternativeSize,
      isAmbiguous,
      confidence,
      explanation,
      advice
    };

  } catch (error) {
    console.error("API Error:", error);
    return {
      suggestedSize: "Error", 
      confidence: 0,
      explanation: "Không thể kết nối đến máy chủ dự đoán. Vui lòng thử lại sau giây lát.",
      advice: "Kiểm tra kết nối mạng của bạn.",
      isAmbiguous: false
    };
  }
};

// --- GEMINI FUNCTION ---

async function generateStylistAdvice(
    measurements: BodyMeasurements, 
    suggestedSize: string, 
    alternativeSize: string | undefined, 
    isAmbiguous: boolean
): Promise<{ explanation: string; advice: string }> {

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key chưa được cấu hình (process.env.API_KEY is empty)");
    }

    // Khởi tạo Gemini AI Client tại thời điểm gọi hàm
    const ai = new GoogleGenAI({ apiKey });

    // Sử dụng model Flash cho phản hồi nhanh (low latency)
    const modelId = "gemini-3-flash-preview"; 

    // Xây dựng prompt chi tiết
    const bodyInfo = `Cao ${measurements.height}cm, Nặng ${measurements.weight}kg` + 
                     (measurements.bust ? `, Ngực ${measurements.bust}cm, Eo ${measurements.waist}cm, Mông ${measurements.hips}cm` : '');

    const prompt = `
    Bạn là một Stylist thời trang cao cấp của thương hiệu MAVO.
    
    Thông tin khách hàng: ${bodyInfo}
    Kết quả đo size của hệ thống: Size ${suggestedSize} ${isAmbiguous ? `(Phân vân với size ${alternativeSize})` : ''}.

    Nhiệm vụ: Hãy trả về JSON gồm 2 trường:
    1. "explanation": Giải thích tại sao chọn size ${suggestedSize} cho body này một cách thuyết phục, ngắn gọn (dưới 40 từ). Nếu có phân vân size, hãy so sánh nhẹ.
    2. "advice": Lời khuyên phối đồ (Outfit recommendation) phù hợp nhất với dáng người này (ví dụ: dáng gầy, dáng đậm, dáng chuẩn...) để họ tự tin hơn. Văn phong thân thiện, sành điệu (dưới 50 từ).
    `;

    const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    explanation: { type: Type.STRING },
                    advice: { type: Type.STRING },
                },
                required: ["explanation", "advice"],
            } as Schema,
        }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from Gemini");
    
    return JSON.parse(jsonText);
}

// --- STATIC FALLBACKS (Dự phòng) ---

const getStaticExplanation = (result: any, measurements: BodyMeasurements, useFullModel: boolean) => {
    const h = measurements.height;
    const w = measurements.weight;

    if (result.isAmbiguous && result.alternativeSize) {
        return `Với ${h}cm và ${w}kg, chỉ số của bạn nằm ở ngưỡng chuyển giao giữa size ${result.suggestedSize} và ${result.alternativeSize}. Hệ thống chọn ${result.suggestedSize} để thoải mái nhất.`;
    }

    let detailText = "";
    if (useFullModel) {
        detailText = `kết hợp số đo 3 vòng, `;
    }

    return `Hệ thống AI đã phân tích: Cao ${h}cm, Nặng ${w}kg ${detailText}và xác định Size ${result.suggestedSize} là tối ưu nhất.`;
};

const getStaticAdvice = (size: string) => {
    switch (size) {
        case 'S': return "Dáng người nhỏ nhắn, hãy chọn áo sáng màu hoặc sọc ngang để trông đầy đặn hơn.";
        case 'M': return "Vóc dáng cân đối, bạn phù hợp với hầu hết các form áo từ Slim-fit đến Regular.";
        case 'L': return "Vóc dáng chuẩn, các thiết kế tối giản sẽ tôn lên chiều cao và vẻ nam tính của bạn.";
        case 'XL': return "Với vóc dáng cao lớn, hãy chọn trang phục vừa vặn, chất liệu đứng form để thoải mái.";
        default: return "Hãy chọn trang phục mang lại sự tự tin nhất cho bạn.";
    }
};