
import { BodyMeasurements, SizePrediction } from "../types";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const API_URL = "https://mavo-size-api.onrender.com";

export const predictSizeWithGemini = async (
  measurements: BodyMeasurements,
  useFullModel: boolean
): Promise<SizePrediction> => {
  try {
    // 1. GỌI PYTHON API: Để lấy Size chính xác (Logic toán học/Random Forest)
    // Cập nhật: Chấp nhận giá trị null cho 3 vòng
    const requestBody = {
      cao: parseFloat(measurements.height) || 0,
      nang: parseFloat(measurements.weight) || 0,
      nguc: measurements.bust ? parseFloat(measurements.bust) : null,
      eo: measurements.waist ? parseFloat(measurements.waist) : null,
      mong: measurements.hips ? parseFloat(measurements.hips) : null,
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
    
    // Lấy dữ liệu từ cấu trúc API mới
    let suggestedSize = data.size || "M"; 
    // Đảm bảo là string
    if (typeof suggestedSize !== 'string') {
        suggestedSize = String(suggestedSize);
    }
    suggestedSize = suggestedSize.trim();
    
    // Parse percent: "83%" -> 83
    let confidence = 95;
    if (data.percent) {
        const percentStr = data.percent.toString().replace('%', '');
        confidence = parseFloat(percentStr) || 95;
    } else if (data.confidence) {
        // Fallback for old structure just in case
        confidence = parseFloat(data.confidence);
    }

    const apiMessage = data.message || "Size phù hợp nhất với bạn.";
    
    let isAmbiguous = data.is_ambiguous || false;
    let alternativeSize = data.alt_size || data.alternative_size || undefined;

    // --- EXTRACTION LOGIC: TÌM SIZE PHỤ TRONG MESSAGE ---
    // API mới trả về size phụ trong message dạng: "... chọn **L**, nhưng hãy cân nhắc thử thêm **M** ..."
    if (!alternativeSize) {
        // Tìm tất cả các đoạn văn bản nằm trong dấu **...**
        const boldMatches = apiMessage.match(/\*\*([^\*]+)\*\*/g);
        
        if (boldMatches) {
            // Loại bỏ dấu ** và khoảng trắng
            const cleanMatches = boldMatches.map((m: string) => m.replace(/\*\*/g, '').trim());
            
            // Tìm một size trong số đó KHÁC với suggestedSize
            // (Ví dụ suggestedSize là L, tìm thấy M trong message)
            const otherSize = cleanMatches.find((s: string) => s.toUpperCase() !== suggestedSize.toUpperCase());
            
            if (otherSize) {
                alternativeSize = otherSize;
                isAmbiguous = true;
            }
        }
    }

    // --- LEGACY LOGIC: XỬ LÝ CHUỖI SIZE PHỨC TẠP (VD: "S/M") ---
    // Nếu chưa tìm thấy size phụ nhưng size chính có dấu phân cách
    if (!isAmbiguous) {
        const splitRegex = /\s*(?:hoặc|or|\/|\\|\||-)\s*/i;
        const parts = suggestedSize.split(splitRegex);

        if (parts.length >= 2 && parts[0] && parts[1]) {
             if (parts[0].length <= 5 && parts[1].length <= 5) {
                 suggestedSize = parts[0].trim();
                 alternativeSize = parts[1].trim();
                 isAmbiguous = true;
             }
        }
    }
    // ---------------------------------------------

    // 2. GỌI GEMINI API: Để sinh "Lời khuyên" và "Giải thích"
    let explanation = "";
    let advice = "";

    try {
        const geminiContent = await generateStylistAdvice(measurements, suggestedSize, alternativeSize, isAmbiguous, apiMessage);
        explanation = geminiContent.explanation;
        advice = geminiContent.advice;
    } catch (geminiError) {
        console.warn("Gemini Error, falling back to static text:", geminiError);
        const resultStruct = { suggestedSize, alternativeSize, isAmbiguous, confidence };
        explanation = getStaticExplanation(resultStruct, measurements, useFullModel, apiMessage);
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
    isAmbiguous: boolean,
    apiMessage: string
): Promise<{ explanation: string; advice: string }> {

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key chưa được cấu hình");
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelId = "gemini-3-flash-preview"; 

    const bodyInfo = `Cao ${measurements.height}cm, Nặng ${measurements.weight}kg` + 
                     (measurements.bust ? `, Ngực ${measurements.bust}cm` : '') +
                     (measurements.waist ? `, Eo ${measurements.waist}cm` : '') +
                     (measurements.hips ? `, Mông ${measurements.hips}cm` : '');

    const prompt = `
    Bạn là một Stylist thời trang cao cấp của thương hiệu MAVO.
    
    Thông tin khách hàng: ${bodyInfo}
    Kết quả từ hệ thống đo lường (Server backend): "${apiMessage}" (Size: ${suggestedSize} ${isAmbiguous ? `, hoặc ${alternativeSize}` : ''}).

    Nhiệm vụ: Hãy trả về JSON gồm 2 trường:
    1. "explanation": Dựa vào thông báo của server ("${apiMessage}"), hãy giải thích tại sao chọn size này cho body của khách một cách thuyết phục và tự nhiên. Ngắn gọn (dưới 40 từ).
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

const getStaticExplanation = (result: any, measurements: BodyMeasurements, useFullModel: boolean, apiMessage: string) => {
    // Nếu có message từ API, ưu tiên dùng nó
    if (apiMessage && apiMessage.length > 5) {
        return apiMessage;
    }

    const h = measurements.height;
    const w = measurements.weight;

    if (result.isAmbiguous && result.alternativeSize) {
        return `Với chiều cao ${h}cm và cân nặng ${w}kg, số đo của bạn nằm ở ngưỡng giao thoa. Đề xuất Size ${result.suggestedSize} hoặc ${result.alternativeSize}.`;
    }

    return `Hệ thống AI đã phân tích: Cao ${h}cm, Nặng ${w}kg và xác định Size ${result.suggestedSize} là tối ưu nhất.`;
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
