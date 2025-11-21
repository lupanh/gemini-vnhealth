import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PatientInfo, ScreeningResult, ChatMessage } from "../types";

const apiKey = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// Schema mô phỏng cấu trúc trả về của WebMD
const screeningResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    riskLevel: {
      type: Type.STRING,
      enum: [
        "Thấp - Tự chăm sóc", 
        "Trung bình - Nên đi khám", 
        "Cao - Khám ngay trong ngày", 
        "Khẩn cấp - Gọi cấp cứu 115"
      ],
      description: "Mức độ khẩn cấp dựa trên triage y tế chuẩn.",
    },
    triageMessage: {
      type: Type.STRING,
      description: "Câu hành động ngắn gọn, súc tích (VD: Gọi 115 ngay lập tức hoặc Đi khám đa khoa trong 24h).",
    },
    summary: {
      type: Type.STRING,
      description: "Tổng quan tình trạng lâm sàng của bệnh nhân.",
    },
    potentialConditions: {
      type: Type.ARRAY,
      description: "Danh sách chẩn đoán phân biệt, sắp xếp theo độ khớp (Match %).",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Tên bệnh" },
          matchPercentage: { type: Type.NUMBER, description: "Độ khớp triệu chứng (0-100)" },
          description: { type: Type.STRING, description: "Mô tả ngắn về bệnh trong ngữ cảnh này" },
          reasoning: { type: Type.STRING, description: "Các triệu chứng của bệnh nhân KHỚP với bệnh này" },
          missingSymptoms: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Các triệu chứng điển hình của bệnh này mà bệnh nhân KHÔNG có" 
          }
        },
        required: ["name", "matchPercentage", "description", "reasoning"]
      }
    },
    careAdvice: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Hướng dẫn tự chăm sóc chi tiết từng bước."
    },
    recommendedSpecialist: {
      type: Type.STRING,
      description: "Chuyên khoa chính xác nhất để khám."
    }
  },
  required: ["riskLevel", "triageMessage", "summary", "potentialConditions", "careAdvice", "recommendedSpecialist"]
};

export const analyzeSymptoms = async (data: PatientInfo): Promise<ScreeningResult> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Đóng vai trò là Hệ thống Kiểm tra Triệu chứng (Symptom Checker) chuẩn y khoa quốc tế (như WebMD, Mayo Clinic) nhưng được tối ưu hóa cho bối cảnh y tế Việt Nam.

    DỮ LIỆU LÂM SÀNG:
    ${data.generatedNarrative}

    NHIỆM VỤ:
    1. Thực hiện Chẩn đoán phân biệt (Differential Diagnosis).
    2. Tính toán "Độ khớp" (Match Percentage) cho từng bệnh dựa trên số lượng triệu chứng trùng khớp.
    3. Đặc biệt lưu ý các bệnh nhiệt đới và truyền nhiễm phổ biến tại Việt Nam:
       - Sốt xuất huyết (Dengue): Sốt cao, đau hốc mắt, xuất huyết, tiểu cầu giảm (nếu có).
       - Cúm A/B, Sởi, Thủy đậu.
       - Tay Chân Miệng (ở trẻ em).
       - Ngộ độc thực phẩm / Rối loạn tiêu hóa.
    4. Đánh giá mức độ khẩn cấp (Triage) cực kỳ thận trọng. Nếu có dấu hiệu nguy hiểm (khó thở, li bì, đau ngực dữ dội...), phải báo Khẩn cấp.

    YÊU CẦU OUTPUT:
    Trả về JSON tuân thủ schema đã cung cấp. Ngôn ngữ: Tiếng Việt y khoa chuẩn mực, dễ hiểu.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: screeningResponseSchema,
        temperature: 0.2, // Low temperature for analytical consistency
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as ScreeningResult;
  } catch (error) {
    console.error("Error analyzing symptoms:", error);
    throw error;
  }
};

export const chatWithHealthAssistant = async (history: ChatMessage[], newMessage: string, patientContext: PatientInfo, screeningResult: ScreeningResult): Promise<string> => {
    const model = "gemini-2.5-flash";

    const context = `
      CONTEXT:
      Bệnh nhân: ${patientContext.gender}, ${patientContext.age} tuổi.
      Triệu chứng chính: ${patientContext.chiefComplaint}.
      Chi tiết: ${patientContext.generatedNarrative}
      
      KẾT QUẢ SÀNG LỌC (WebMD Style Analysis):
      - Chẩn đoán hàng đầu: ${screeningResult.potentialConditions[0]?.name} (${screeningResult.potentialConditions[0]?.matchPercentage}% khớp).
      - Mức độ: ${screeningResult.riskLevel}.
      - Lời khuyên: ${screeningResult.triageMessage}.
    `;

    const chatSession = ai.chats.create({
      model,
      config: {
        systemInstruction: `
          Bạn là Bác sĩ AI tư vấn trực tuyến của VN HealthGuard.
          Phong cách trả lời: Chuyên nghiệp, Khách quan, Dựa trên bằng chứng (Evidence-based), giống phong cách WebMD/Healthline.
          
          Hướng dẫn:
          1. Trả lời câu hỏi người dùng dựa trên ngữ cảnh bệnh án đã có.
          2. Nếu người dùng hỏi về điều trị, hãy đưa ra phác đồ điều trị tiêu chuẩn (Standard of Care) cho các bệnh thông thường, nhưng LUÔN kèm theo khuyến cáo "Đây là thông tin tham khảo, vui lòng tuân thủ chỉ định của bác sĩ".
          3. Nếu triệu chứng nguy hiểm, hãy giục người dùng đi bệnh viện ngay.
          4. Giải thích cơ chế bệnh sinh đơn giản nếu được hỏi.
        `,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chatSession.sendMessage({ message: `${context}\n\nCâu hỏi người dùng: ${newMessage}` });
    return result.text || "Xin lỗi, tôi cần suy nghĩ thêm.";
};