
import { BodyMeasurements, SizePrediction } from "../types";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const API_URL = "https://mavo-size-api.onrender.com";

export const predictSizeWithGemini = async (
  measurements: BodyMeasurements,
  useFullModel: boolean
): Promise<SizePrediction> => {
  try {
    // 1. GỌI PYTHON API: Để lấy Size chính xác (Logic toán học/Random Forest)
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
    
    // Lấy dữ liệu thô từ API
    let suggestedSize = data.size || data.prediction || "M"; 
    const confidence = data.confidence ? parseFloat(data.confidence) : 95;
    let isAmbiguous = data.is_ambiguous || false;
    let alternativeSize = data.alt_size || data.alternative_size || undefined;

    // --- LOGIC FIX: XỬ LÝ CHUỖI SIZE PHỨC TẠP ---
    // Nếu API trả về dạng gộp như "S/M", "S hoặc M" mà chưa set cờ is_ambiguous, ta sẽ tự tách nó ra.
    if (typeof suggestedSize === 'string') {
        suggestedSize = suggestedSize.trim();
        
        // Regex tìm các từ khóa phân tách: hoặc, or, dấu /, dấu -, dấu |
        const splitRegex = /\s*(?:hoặc|or|\/|\\|\||-)\s*/i;
        const parts = suggestedSize.split(splitRegex);

        // Chỉ tách nếu tìm thấy 2 phần rõ ràng và độ dài mỗi phần ngắn (để tránh tách nhầm các từ dài)
        if (parts.length >= 2 && parts[0] && parts[1]) {
             // Kiểm tra độ dài để đảm bảo đây là mã size (VD: S, M, XL) chứ không phải câu văn
             if (parts[0].length <= 5 && parts[1].length <= 5) {
                 suggestedSize = parts[0].trim();
                 alternativeSize = parts[1].trim();
                 isAmbiguous = true; // Kích hoạt giao diện 2 ô
             }
        }
    }
    // ---------------------------------------------

    // 2. GỌI GEMINI API: Để sinh "Lời khuyên" và "Giải thích"
    let explanation = "";
    let advice = "";

    try {
        const geminiContent = await generateStylistAdvice(measurements, suggestedSize, alternativeSize, isAmbiguous);
        explanation = geminiContent.explanation;
        advice = geminiContent.advice;
    } catch (geminiError) {
        console.warn("Gemini Error, falling back to static text:", geminiError);
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
        throw new Error("API Key chưa được cấu hình");
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-3-flash-preview"; 

    const bodyInfo = `Cao ${measurements.height}cm, Nặng ${measurements.weight}kg` + 
                     (measurements.bust ? `, Ngực ${measurements.bust}cm, Eo ${measurements.waist}cm, Mông ${measurements.hips}cm` : '');

    const prompt = `
    Bạn là một Stylist thời trang cao cấp của thương hiệu MAVO.
    
    Thông tin khách hàng: ${bodyInfo}
    Kết quả đo size: Size ${suggestedSize} ${isAmbiguous ? `(Phân vân với size ${alternativeSize})` : ''}.

    Nhiệm vụ: Hãy trả về JSON gồm 2 trường:
    1. "explanation": Giải thích tại sao chọn size ${suggestedSize} cho body này một cách thuyết phục, ngắn gọn (dưới 40 từ).
    2. "advice": Lời khuyên phối đồ (Outfit recommendation) phù hợp nhất với dáng người này (ví dụ: dáng gầy, dáng đậm, dáng chuẩn...) để họ tự tin hơn. Văn phong thân thiện (dưới 50 từ).
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

// --- STATIC FALLBACKS ---

const getStaticExplanation = (result: any, measurements: BodyMeasurements, useFullModel: boolean) => {
    const h = measurements.height;
    const w = measurements.weight;

    if (result.isAmbiguous && result.alternativeSize) {
        return `Với chiều cao ${h}cm và cân nặng ${w}kg, số đo của bạn nằm ở ngưỡng giao thoa giữa hai size. Hệ thống đề xuất Size ${result.suggestedSize} để vừa vặn nhất, hoặc ${result.alternativeSize} nếu bạn thích rộng rãi.`;
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
