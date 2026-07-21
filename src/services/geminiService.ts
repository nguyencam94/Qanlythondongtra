import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAi() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY || '';
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

export interface HouseholdAnalysis {
  suggestedNotes: string;
  tags: string[];
}

/**
 * Generates community management notes and advisory tags for a household based on its members.
 */
export async function generateHouseholdAnalysis(
  ownerName: string,
  address: string,
  members: { fullName: string; relationship: string; birthDate: string; gender: string; notes: string }[],
  currentNotes: string
): Promise<HouseholdAnalysis> {
  const membersSummary = members.length > 0 
    ? members.map(m => `- ${m.fullName} (${m.relationship}, sinh năm ${m.birthDate.substring(0, 4) || 'chưa rõ'}, Giới tính: ${m.gender}, Ghi chú cư dân: ${m.notes})`).join("\n")
    : "Chưa có thành viên";

  const prompt = `Hãy đóng vai trò là một Tổ trưởng dân phố chuyên nghiệp, chu đáo và tận tâm.
Hãy phân tích thông tin hộ gia đình sau đây để đưa ra nhận xét, ghi chú quản lý chi tiết và các thẻ phân loại (tags) phù hợp phục vụ việc quản lý cư dân, chăm sóc an sinh xã hội, an ninh trật tự và truyền thông nội bộ.

THÔNG TIN HỘ GIA ĐÌNH:
- Chủ hộ: ${ownerName}
- Địa chỉ: ${address}
- Danh sách nhân khẩu:
${membersSummary}
- Ghi chú hiện tại: ${currentNotes || "Không có"}

Yêu cầu đầu ra:
1. suggestedNotes: Một đoạn văn bản ghi chú chi tiết bằng tiếng Việt, viết ngắn gọn nhưng đầy đủ (khoảng 100-150 từ), giọng văn lịch sự, chuyên nghiệp. Nội dung tập trung vào:
   - Đặc điểm nổi bật của hộ (ví dụ: có người già cần quan tâm, có trẻ em, hoặc thành viên thuộc diện chính sách như thương binh, bệnh binh, bộ đội tại ngũ, hộ nghèo, gia đình chính sách...).
   - Đề xuất hoạt động quản lý dân cư hoặc hỗ trợ an sinh xã hội cụ thể.
   - Giữ lại các thông tin hữu ích từ Ghi chú hiện tại nếu có.
2. tags: 2-4 thẻ ngắn gọn phân loại hộ gia đình (ví dụ: "Có Trẻ Nhỏ", "Người Cao Tuổi", "Gia Đình Chính Sách", "Thương Binh", "Hộ Nghèo", "Bộ Đội").

Hãy trả về kết quả dưới dạng JSON hoàn toàn hợp lệ.`;

  const ai = getAi();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: "Bạn là một trợ lý quản trị viên khu dân cư thông minh. Chỉ trả về JSON phù hợp với schema yêu cầu.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedNotes: {
            type: Type.STRING,
            description: "Suggested community notes in Vietnamese.",
          },
          tags: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
            description: "Suggested categorization tags for the household.",
          },
        },
        required: ["suggestedNotes", "tags"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Không nhận được phản hồi từ AI");
  }

  return JSON.parse(text) as HouseholdAnalysis;
}
