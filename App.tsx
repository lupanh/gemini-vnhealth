import React, { useState } from 'react';
import ScreeningForm from './components/ScreeningForm';
import AnalysisReport from './components/AnalysisReport';
import ChatAssistant from './components/ChatAssistant';
import { PatientInfo, ScreeningResult } from './types';
import { analyzeSymptoms } from './services/geminiService';
import { Heart, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<'form' | 'result'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientInfo | null>(null);
  const [result, setResult] = useState<ScreeningResult | null>(null);

  const handleScreeningSubmit = async (data: PatientInfo) => {
    setIsLoading(true);
    setPatientData(data);
    try {
      const analysis = await analyzeSymptoms(data);
      setResult(analysis);
      setStep('result');
    } catch (error) {
      alert("Có lỗi xảy ra khi phân tích. Vui lòng kiểm tra lại kết nối hoặc API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setResult(null);
    setPatientData(null);
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-800">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-lg flex items-center justify-center text-white shadow-lg">
               <Heart fill="currentColor" size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                VN HealthGuard
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Trợ lý y tế thông minh cho người Việt</p>
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 gap-1">
             <ShieldCheck size={16} className="text-teal-500"/>
             <span>Bảo mật & Riêng tư</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {step === 'form' ? (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Bạn đang cảm thấy thế nào?</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Chúng tôi sử dụng AI để phân tích các triệu chứng dựa trên dữ liệu dịch tễ học tại Việt Nam.
                Kết quả chỉ mang tính chất tham khảo, không thay thế bác sĩ.
              </p>
            </div>
            <ScreeningForm onSubmit={handleScreeningSubmit} isLoading={isLoading} />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in">
            <div className="xl:col-span-2">
              {result && patientData && (
                <AnalysisReport 
                  result={result} 
                  patientInfo={patientData} 
                  onReset={handleReset} 
                />
              )}
            </div>
            <div className="xl:col-span-1">
              <div className="sticky top-24">
                 {result && patientData && (
                  <ChatAssistant 
                    patientInfo={patientData} 
                    screeningResult={result} 
                  />
                 )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} VN HealthGuard. Powered by Gemini AI.</p>
          <p className="mt-2 text-xs text-gray-400">
            Lưu ý: Thông tin được cung cấp bởi AI có thể không chính xác tuyệt đối. 
            Trong trường hợp khẩn cấp, vui lòng đến cơ sở y tế gần nhất hoặc gọi 115.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
