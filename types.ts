export enum Gender {
  MALE = 'Nam',
  FEMALE = 'Nữ',
  OTHER = 'Khác'
}

export enum RiskLevel {
  LOW = 'Thấp - Tự chăm sóc',
  MEDIUM = 'Trung bình - Nên đi khám',
  HIGH = 'Cao - Khám ngay trong ngày',
  EMERGENCY = 'Khẩn cấp - Gọi cấp cứu 115'
}

export interface PatientInfo {
  age: number;
  gender: Gender;
  location: string; // Quan trọng cho dịch tễ học
  
  // Core data
  chiefComplaint: string; // Triệu chứng chính
  symptomDetails: Record<string, any>; // Câu trả lời chi tiết dạng Key-Value
  medicalHistory: string[]; // Tiền sử bệnh chọn từ list
  duration: string;
  severity: number; // Thang điểm 1-10
  
  // Narrative for AI
  generatedNarrative: string;
}

export interface DiseaseMatch {
  name: string;
  matchPercentage: number; // Độ khớp với triệu chứng (WebMD style)
  description: string;
  reasoning: string; // Tại sao khớp?
  missingSymptoms?: string[]; // Các triệu chứng bệnh này thường có nhưng bệnh nhân không có
}

export interface ScreeningResult {
  riskLevel: RiskLevel;
  triageMessage: string; // Lời khuyên hành động chính (VD: "Đi cấp cứu ngay")
  summary: string;
  potentialConditions: DiseaseMatch[];
  careAdvice: string[]; // Chăm sóc tại nhà
  recommendedSpecialist: string; 
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}