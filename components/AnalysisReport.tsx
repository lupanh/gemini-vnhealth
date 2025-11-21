import React from 'react';
import { ScreeningResult, RiskLevel, PatientInfo } from '../types';
import { AlertTriangle, CheckCircle, Info, ArrowLeft, Phone, ShieldCheck, UserPlus, Activity } from 'lucide-react';

interface Props {
  result: ScreeningResult;
  patientInfo: PatientInfo;
  onReset: () => void;
}

const AnalysisReport: React.FC<Props> = ({ result, patientInfo, onReset }) => {
  
  // Color logic for Triage Header
  const getTriageStyle = (risk: RiskLevel) => {
    if (risk.includes('Khẩn cấp')) return 'bg-red-600 text-white';
    if (risk.includes('Cao')) return 'bg-orange-500 text-white';
    if (risk.includes('Trung bình')) return 'bg-yellow-500 text-white';
    return 'bg-green-600 text-white';
  };

  const getMatchColor = (pct: number) => {
    if (pct >= 80) return 'bg-red-500';
    if (pct >= 50) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
      
      {/* 1. Triage Banner (WebMD Style) */}
      <div className={`rounded-xl shadow-lg overflow-hidden ${getTriageStyle(result.riskLevel)}`}>
        <div className="p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
           <div className="p-3 bg-white/20 rounded-full">
             <AlertTriangle size={32} />
           </div>
           <div className="flex-1">
             <h2 className="text-2xl font-bold uppercase tracking-wide">{result.riskLevel}</h2>
             <p className="text-lg font-medium opacity-95 mt-1">{result.triageMessage}</p>
           </div>
           {result.riskLevel.includes('Khẩn cấp') && (
             <button className="px-6 py-3 bg-white text-red-600 font-bold rounded-full animate-pulse flex items-center gap-2">
               <Phone size={20} /> Gọi 115
             </button>
           )}
        </div>
      </div>

      {/* 2. Summary & Specialist */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-gray-500 font-semibold text-sm uppercase mb-2 tracking-wider">TỔNG QUAN LÂM SÀNG</h3>
        <p className="text-gray-800 text-lg leading-relaxed">{result.summary}</p>
        <div className="mt-4 pt-4 border-t flex items-center gap-2 text-teal-700 font-bold">
          <UserPlus size={20} />
          Khuyên dùng chuyên khoa: {result.recommendedSpecialist}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Differential Diagnosis (Potential Conditions) */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
             <Activity className="text-teal-600"/> Chẩn đoán phân biệt
          </h3>
          
          <div className="space-y-4">
            {result.potentialConditions.map((cond, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-bold text-gray-800">{cond.name}</h4>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${getMatchColor(cond.matchPercentage)}`}>
                        {cond.matchPercentage}% KHỚP
                      </span>
                    </div>
                  </div>
                  
                  {/* Match Bar */}
                  <div className="w-full bg-gray-200 h-2 rounded-full mb-4">
                    <div 
                      className={`h-2 rounded-full ${getMatchColor(cond.matchPercentage)}`} 
                      style={{ width: `${cond.matchPercentage}%` }}
                    ></div>
                  </div>

                  <p className="text-gray-600 mb-4">{cond.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                      <p className="font-bold text-green-800 mb-1 flex items-center gap-1"><CheckCircle size={14}/> Tại sao khớp?</p>
                      <p className="text-green-700">{cond.reasoning}</p>
                    </div>
                    {cond.missingSymptoms && cond.missingSymptoms.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                         <p className="font-bold text-gray-600 mb-1 flex items-center gap-1"><Info size={14}/> Triệu chứng vắng mặt</p>
                         <ul className="list-disc list-inside text-gray-500">
                           {cond.missingSymptoms.map((s, i) => <li key={i}>{s}</li>)}
                         </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Home Care & Advice */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="text-blue-600"/> Hướng dẫn chăm sóc
            </h3>
            
            <div className="space-y-4">
               {result.careAdvice.map((advice, idx) => (
                 <div key={idx} className="flex gap-3">
                   <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mt-0.5">
                     {idx + 1}
                   </div>
                   <p className="text-gray-700 text-sm">{advice}</p>
                 </div>
               ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
               <p className="text-xs text-gray-400 italic">
                 *Lưu ý: Kết quả này chỉ mang tính chất tham khảo dựa trên thuật toán AI. Không thay thế chẩn đoán hình ảnh và xét nghiệm của bác sĩ.
               </p>
            </div>
          </div>

           <button 
             onClick={onReset}
             className="w-full py-3 border-2 border-gray-300 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
           >
             <ArrowLeft size={18} /> Kiểm tra lại
           </button>
        </div>

      </div>
    </div>
  );
};

export default AnalysisReport;