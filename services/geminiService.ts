import { GoogleGenAI, Type } from "@google/genai";
import { BodyMeasurements, SizePrediction } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- MÔ PHỎNG MODEL LOGIC (Chuyển từ Python sang TypeScript) ---
// Vì browser không chạy được file .pkl, ta mô phỏng logic quyết định.

const SIZES = ['S', 'M', 'L', 'XL'];

// Hàm mô phỏng Model Basic (Chỉ dựa vào Cao/Nặng & Hiệu số)
const simulateModelBasic = (height: number, weight: number): { size: string, altSize?: string, isAmbiguous: boolean, confidence: number } => {
  // Logic: Tính toán điểm số dựa trên cân nặng điều chỉnh bởi chiều cao (tương tự BMI nhưng tinh chỉnh cho fit đồ)
  // Công thức giả lập: Weight - (Height - 160) * 0.4
  // Người cao hơn thì cùng cân nặng sẽ trông gầy hơn -> Score thấp hơn -> Size nhỏ hơn
  const adjustedScore = weight - (height - 160) * 0.4;

  let sizeIndex = 0;
  let confidence = 0;

  // Ngưỡng phân loại (Decision Boundaries giả lập cho form người VN)
  // < 48: S
  // 48 - 58: M
  // 58 - 68: L
  // > 68: XL
  if (adjustedScore < 48) {
    sizeIndex = 0; // S
    confidence = 100 - (adjustedScore - 40) * 2; 
  } else if (adjustedScore < 58) {
    sizeIndex = 1; // M
    confidence = 100 - Math.abs(adjustedScore - 53) * 3;
  } else if (adjustedScore < 68) {
    sizeIndex = 2; // L
    confidence = 100 - Math.abs(adjustedScore - 63) * 3;
  } else {
    sizeIndex = 3; // XL
    confidence = 100 - (75 - adjustedScore) * 2;
  }

  // Cap index và confidence
  sizeIndex = Math.max(0, Math.min(3, sizeIndex));
  confidence = Math.max(65, Math.min(98, confidence)); 

  const suggestedSize = SIZES[sizeIndex];
  
  // Logic Ambiguous (Phân vân): Giống Python "if (score_1 - score_2) < 0.15"
  // Ở đây ta kiểm tra nếu điểm số nằm sát ranh giới (± 1.5 đơn vị)
  const boundaries = [48, 58, 68];
  let isAmbiguous = false;
  let altSize = undefined;

  for (let i = 0; i < boundaries.length; i++) {
    if (Math.abs(adjustedScore - boundaries[i]) < 1.5) {
      isAmbiguous = true;
      // Nếu < boundary -> đang ở size nhỏ (suggested), alt là size lớn
      // Nếu > boundary -> đang ở size lớn (suggested), alt là size nhỏ
      if (adjustedScore < boundaries[i]) {
         // Đang S, gần M -> Alt M
         altSize = SIZES[i+1]; 
      } else {
         // Đang M, gần S -> Alt S
         altSize = SIZES[i];
      }
      break;
    }
  }

  // Sắp xếp lại: Suggested luôn là size lớn (thoải mái) nếu ambiguous, theo logic bài toán
  if (isAmbiguous && altSize) {
      const idxSug = SIZES.indexOf(suggestedSize);
      const idxAlt = SIZES.indexOf(altSize);
      if (idxSug < idxAlt) {
          return { size: altSize, altSize: suggestedSize, isAmbiguous: true, confidence: 70 };
      }
  }

  return {
    size: suggestedSize,
    altSize: isAmbiguous ? altSize : undefined,
    isAmbiguous,
    confidence
  };
};

// Hàm mô phỏng Model Full (Dựa trên 3 vòng)
const simulateModelFull = (measurements: BodyMeasurements): { size: string, confidence: number } => {
  const h = parseFloat(measurements.height);
  const w = parseFloat(measurements.weight);
  const bust = parseFloat(measurements.bust);
  const waist = parseFloat(measurements.waist);
  const hips = parseFloat(measurements.hips);

  // Logic Max Size: Quần áo phải vừa chỗ to nhất trên cơ thể
  // Bảng size tham khảo
  const getSize = (val: number, type: 'bust'|'waist'|'hips') => {
      if (type === 'bust') {
          if (val < 84) return 0; // S
          if (val < 90) return 1; // M
          if (val < 96) return 2; // L
          return 3; // XL
      }
      if (type === 'waist') {
          if (val < 66) return 0;
          if (val < 72) return 1;
          if (val < 78) return 2;
          return 3;
      }
      if (type === 'hips') {
          if (val < 90) return 0;
          if (val < 96) return 1;
          if (val < 102) return 2;
          return 3;
      }
      return 0;
  };

  const idxBust = getSize(bust, 'bust');
  const idxWaist = getSize(waist, 'waist');
  const idxHips = getSize(hips, 'hips');

  // Basic check để tránh size quá lệch với cân nặng
  const basicRes = simulateModelBasic(h, w);
  const idxWeight = SIZES.indexOf(basicRes.size);

  // Lấy max của các vòng chính
  let finalIdx = Math.max(idxBust, idxWaist, idxHips);

  // Điều chỉnh: Nếu size theo cân nặng nhỏ hơn size vòng quá nhiều (vd bụng to), ưu tiên size vòng
  // Nếu size cân nặng lớn hơn size vòng (người đặc), ưu tiên trung bình
  if (idxWeight > finalIdx) {
      finalIdx = Math.ceil((finalIdx + idxWeight) / 2);
  }

  finalIdx = Math.max(0, Math.min(3, finalIdx));

  return {
    size: SIZES[finalIdx],
    confidence: 95 // Model Full độ tin cậy cao
  };
};

// --- MAIN SERVICE ---

export const predictSizeWithGemini = async (
  measurements: BodyMeasurements,
  useFullModel: boolean
): Promise<SizePrediction> => {
  try {
    const height = parseFloat(measurements.height);
    const weight = parseFloat(measurements.weight);
    const hieu_so = height - weight;

    // 1. CHẠY LOGIC TÍNH TOÁN CỨNG (Rule-based)
    let calculatedResult;
    
    if (useFullModel) {
      const res = simulateModelFull(measurements);
      calculatedResult = {
        suggestedSize: res.size,
        alternativeSize: undefined,
        isAmbiguous: false,
        confidence: res.confidence
      };
    } else {
      const res = simulateModelBasic(height, weight);
      calculatedResult = {
        suggestedSize: res.size,
        alternativeSize: res.altSize,
        isAmbiguous: res.isAmbiguous,
        confidence: res.confidence
      };
    }

    // 2. DÙNG GEMINI ĐỂ VIẾT LỜI KHUYÊN (Text Generation Only)
    // AI sẽ nhận đầu vào là kết quả đã tính toán và số liệu, để viết văn giải thích
    const prompt = `
      Bạn là chuyên gia tư vấn thời trang MAVO.
      
      Thông tin khách:
      - Cao: ${measurements.height}cm, Nặng: ${measurements.weight}kg
      - Hiệu số (Cao - Nặng): ${hieu_so}
      ${useFullModel ? `- Số đo 3 vòng: ${measurements.bust} - ${measurements.waist} - ${measurements.hips}` : ''}
      
      KẾT QUẢ TÍNH TOÁN CỦA HỆ THỐNG (BẠN PHẢI TUÂN THEO):
      - Size chính: ${calculatedResult.suggestedSize}
      ${calculatedResult.isAmbiguous ? `- Size phụ (ôm body): ${calculatedResult.alternativeSize}` : ''}
      
      Nhiệm vụ: Viết JSON giải thích và lời khuyên.
      - "explanation": Giải thích ngắn gọn tại sao chọn size ${calculatedResult.suggestedSize} dựa trên số liệu. ${calculatedResult.isAmbiguous ? `Nhắc đến việc khách hàng đang ở ngưỡng giữa 2 size, chọn ${calculatedResult.suggestedSize} để thoải mái hoặc size kia để ôm body.` : ''}
      - "advice": Lời khuyên phối đồ cho dáng người này (ví dụ dáng quả lê, táo, hay chữ nhật dựa trên số đo).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
        },
      },
    });

    const responseText = response.text;
    const textData = responseText ? JSON.parse(responseText) : { explanation: "Phù hợp với chỉ số cơ thể của bạn.", advice: "Chọn trang phục tôn dáng." };

    return {
      suggestedSize: calculatedResult.suggestedSize,
      alternativeSize: calculatedResult.alternativeSize,
      isAmbiguous: calculatedResult.isAmbiguous,
      confidence: calculatedResult.confidence,
      explanation: textData.explanation,
      advice: textData.advice
    };

  } catch (error) {
    console.error("Error:", error);
    // Fallback safe return
    return {
      suggestedSize: "M", 
      confidence: 0,
      explanation: "Có lỗi kết nối, vui lòng tham khảo bảng size.",
      advice: "Cân nhắc thử trực tiếp tại cửa hàng.",
      isAmbiguous: false
    };
  }
};