import { BodyMeasurements, SizePrediction } from "../types";

const API_URL = "https://mavo-size-api.onrender.com";

export const predictSizeWithGemini = async (
  measurements: BodyMeasurements,
  useFullModel: boolean
): Promise<SizePrediction> => {
  try {
    // 1. Chuẩn bị dữ liệu gửi lên API theo format yêu cầu
    // Model Python thường yêu cầu số (float), nên cần parse từ string
    const requestBody = {
      cao: parseFloat(measurements.height) || 0,
      nang: parseFloat(measurements.weight) || 0,
      nguc: parseFloat(measurements.bust) || 0,
      eo: parseFloat(measurements.waist) || 0,
      mong: parseFloat(measurements.hips) || 0,
    };

    // 2. Gọi API
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
    
    // 3. Xử lý dữ liệu trả về từ API
    // Giả định API trả về JSON có các trường như size, confidence, hoặc chỉ size.
    // Map dữ liệu API về cấu trúc frontend cần.
    const suggestedSize = data.size || data.prediction || "M"; 
    const confidence = data.confidence ? parseFloat(data.confidence) : 95;
    const isAmbiguous = data.is_ambiguous || false;
    const alternativeSize = data.alt_size || data.alternative_size || undefined;

    const resultStruct = {
        suggestedSize,
        alternativeSize,
        isAmbiguous,
        confidence
    };

    // 4. Tạo nội dung chữ (Explanation/Advice) tại Client
    // Vì API model thường chỉ trả về kết quả dự đoán (Label), ta giữ lại hàm sinh text ở frontend để UI đẹp.
    const explanation = getStaticExplanation(resultStruct, measurements, useFullModel);
    const advice = getStaticAdvice(suggestedSize);

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
      explanation: "Không thể kết nối đến máy chủ dự đoán (API). Có thể server đang khởi động, vui lòng thử lại sau giây lát.",
      advice: "Kiểm tra kết nối mạng của bạn.",
      isAmbiguous: false
    };
  }
};

// --- HELPER FUNCTIONS FOR STATIC TEXT ---
// Giữ lại các hàm này để tạo nội dung hiển thị thân thiện với người dùng

const getStaticExplanation = (result: any, measurements: BodyMeasurements, useFullModel: boolean) => {
    const h = measurements.height;
    const w = measurements.weight;

    if (result.isAmbiguous && result.alternativeSize) {
        return `Dựa trên chiều cao ${h}cm và cân nặng ${w}kg, Server MAVO nhận thấy chỉ số của bạn nằm ở ngưỡng chuyển giao giữa size ${result.suggestedSize} và ${result.alternativeSize}. Hệ thống ưu tiên đề xuất size ${result.suggestedSize} để đảm bảo sự thoải mái. Tuy nhiên, nếu thích mặc ôm (Slim-fit), bạn có thể chọn ${result.alternativeSize}.`;
    }

    let detailText = "";
    if (useFullModel) {
        detailText = `kết hợp với số đo 3 vòng (${measurements.bust}-${measurements.waist}-${measurements.hips}), `;
    }

    return `Hệ thống AI MAVO đã phân tích dữ liệu: Cao ${h}cm, Nặng ${w}kg ${detailText}và xác định Size ${result.suggestedSize} là lựa chọn tối ưu nhất cho vóc dáng của bạn.`;
};

const getStaticAdvice = (size: string) => {
    switch (size) {
        case 'S':
            return "Size S phù hợp với vóc dáng nhỏ nhắn. Hãy ưu tiên các mẫu áo sáng màu hoặc họa tiết kẻ ngang để tạo cảm giác đầy đặn hơn. Tránh đồ quá rộng (Oversize).";
        case 'M':
            return "Size M dành cho vóc dáng cân đối. Bạn có thể thoải mái thử nghiệm nhiều phong cách từ Slim-fit đến Regular-fit.";
        case 'L':
            return "Size L phù hợp với vóc dáng chuẩn. Các thiết kế tối giản, form dáng vừa vặn sẽ giúp tôn lên chiều cao và vẻ nam tính của bạn.";
        case 'XL':
            return "Size XL dành cho vóc dáng cao lớn hoặc đậm người. Hãy chọn trang phục vừa vặn, chất liệu đứng form nhưng co giãn tốt để luôn thoải mái.";
        default:
            return "Hãy chọn trang phục mang lại sự tự tin và thoải mái nhất cho bạn.";
    }
};