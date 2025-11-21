import React, { useState, useEffect } from 'react';
import { Gender, PatientInfo } from '../types';
import { 
  Activity, Thermometer, Wind, Brain, AlertCircle, 
  ArrowRight, ArrowLeft, Check, Stethoscope, MapPin, Search, UserCircle,
  Heart, Utensils, Bone, Droplet, Zap, Shield
} from 'lucide-react';

interface Props {
  onSubmit: (data: PatientInfo) => void;
  isLoading: boolean;
}

// --- Data Structures ---

type QuestionType = 'single' | 'multiple' | 'scale' | 'text';

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
}

interface CategoryFlow {
  id: string;
  label: string;
  keywords: string[];
  icon: React.ReactNode;
  // Map body parts to categories. 'systemic' means whole body.
  bodyPart?: 'head' | 'chest' | 'abdomen' | 'pelvis' | 'limbs' | 'systemic';
  questions: Question[];
}

const MEDICAL_HISTORY_OPTIONS = [
  'Không có', 'Tiểu đường', 'Tăng huyết áp', 'Hen suyễn', 
  'Bệnh tim mạch', 'Suy giảm miễn dịch', 'Đang mang thai', 'Hút thuốc lá', 
  'Viêm gan B/C', 'Dị ứng thuốc'
];

const GENERAL_QUESTIONS: Question[] = [
  {
    id: 'fever_status',
    text: 'Tình trạng sốt?',
    type: 'single',
    options: ['Không sốt', 'Sốt nhẹ (37.5 - 38°C)', 'Sốt cao (38 - 39.5°C)', 'Sốt rất cao (> 39.5°C)', 'Sốt về chiều/đêm']
  },
  {
    id: 'pain_level',
    text: 'Mức độ khó chịu/đau (1-10)',
    type: 'scale'
  },
  {
    id: 'symptom_duration',
    text: 'Triệu chứng kéo dài bao lâu?',
    type: 'single',
    options: ['Vừa mới (< 24h)', '1 - 3 ngày', '4 - 7 ngày', '> 1 tuần', 'Mãn tính (> 1 tháng)']
  }
];

// --- 9 DISEASE GROUPS ---

const CATEGORY_FLOWS: CategoryFlow[] = [
  {
    id: 'respiratory',
    label: 'Nhóm Hô hấp',
    keywords: ['ho', 'khó thở', 'phổi', 'họng', 'sổ mũi', 'cúm', 'đờm', 'thở rít'],
    icon: <Wind className="w-6 h-6 text-blue-500"/>,
    bodyPart: 'chest',
    questions: [
      {
        id: 'resp_symptom',
        text: 'Triệu chứng hô hấp chính?',
        type: 'multiple',
        options: ['Ho khan', 'Ho có đờm', 'Ho ra máu', 'Đau họng', 'Sổ mũi/Nghẹt mũi', 'Khó thở']
      },
      {
        id: 'resp_sputum',
        text: 'Màu sắc đờm (nếu có)?',
        type: 'single',
        options: ['Không có', 'Trong/Trắng', 'Vàng/Xanh', 'Gỉ sắt/Nâu', 'Có lẫn máu']
      },
      {
        id: 'resp_breath',
        text: 'Tính chất khó thở?',
        type: 'single',
        options: ['Không khó thở', 'Khó thở khi gắng sức', 'Khó thở khi nằm', 'Thở khò khè/rít']
      }
    ]
  },
  {
    id: 'cardiovascular',
    label: 'Nhóm Tim mạch',
    keywords: ['tim', 'đau ngực', 'hồi hộp', 'đánh trống ngực', 'huyết áp', 'ngất', 'phù chân'],
    icon: <Heart className="w-6 h-6 text-red-600"/>,
    bodyPart: 'chest',
    questions: [
      {
        id: 'cardio_pain',
        text: 'Đặc điểm đau ngực?',
        type: 'single',
        options: ['Không đau', 'Đau nhói như dao đâm', 'Đè nặng/Thắt nghẹt giữa ngực', 'Đau lan ra tay trái/cằm', 'Đau tăng khi ấn vào']
      },
      {
        id: 'cardio_other',
        text: 'Dấu hiệu kèm theo?',
        type: 'multiple',
        options: ['Hồi hộp/Đánh trống ngực', 'Khó thở khi nằm đầu thấp', 'Phù 2 chân', 'Tím môi/đầu chi', 'Ngất xỉu']
      }
    ]
  },
  {
    id: 'digestive',
    label: 'Nhóm Tiêu hóa – Gan mật',
    keywords: ['bụng', 'nôn', 'tiêu chảy', 'táo bón', 'dạ dày', 'gan', 'vàng da', 'ăn'],
    icon: <Utensils className="w-6 h-6 text-orange-500"/>,
    bodyPart: 'abdomen',
    questions: [
      {
        id: 'dig_pain_loc',
        text: 'Vị trí đau bụng?',
        type: 'single',
        options: ['Không đau', 'Thượng vị (Trên rốn)', 'Quanh rốn', 'Hạ sườn phải', 'Bụng dưới', 'Đau khắp bụng']
      },
      {
        id: 'dig_stool',
        text: 'Đại tiện?',
        type: 'single',
        options: ['Bình thường', 'Táo bón', 'Tiêu chảy', 'Phân đen như bã cafe', 'Phân có máu tươi', 'Phân bạc màu']
      },
      {
        id: 'dig_liver',
        text: 'Dấu hiệu gan mật?',
        type: 'multiple',
        options: ['Vàng da/Vàng mắt', 'Nước tiểu sẫm màu', 'Ngứa da', 'Chán ăn/Sợ mỡ', 'Đắng miệng']
      }
    ]
  },
  {
    id: 'neurology',
    label: 'Nhóm Thần kinh – Tâm thần',
    keywords: ['đau đầu', 'chóng mặt', 'ngất', 'co giật', 'mất ngủ', 'lo âu', 'nhớ', 'liệt'],
    icon: <Brain className="w-6 h-6 text-purple-500"/>,
    bodyPart: 'head',
    questions: [
      {
        id: 'neuro_headache',
        text: 'Đau đầu như thế nào?',
        type: 'single',
        options: ['Không đau', 'Đau nửa đầu', 'Đau cả đầu', 'Đau vùng gáy', 'Đau dữ dội đột ngột']
      },
      {
        id: 'neuro_func',
        text: 'Chức năng thần kinh?',
        type: 'multiple',
        options: ['Yếu/Liệt tay chân', 'Nói khó/Méo miệng', 'Nhìn mờ/Nhìn đôi', 'Co giật', 'Tê bì chân tay']
      },
      {
        id: 'psych_state',
        text: 'Tâm thần & Giấc ngủ?',
        type: 'single',
        options: ['Bình thường', 'Mất ngủ kéo dài', 'Lo âu/Hồi hộp', 'Buồn chán/Mất hứng thú', 'Kích động']
      }
    ]
  },
  {
    id: 'musculoskeletal',
    label: 'Nhóm Cơ – Xương – Khớp',
    keywords: ['xương', 'khớp', 'cơ', 'lưng', 'gối', 'vai', 'đau mỏi', 'sưng khớp'],
    icon: <Bone className="w-6 h-6 text-stone-500"/>,
    bodyPart: 'limbs',
    questions: [
      {
        id: 'msk_loc',
        text: 'Vị trí đau chính?',
        type: 'multiple',
        options: ['Cột sống cổ/thắt lưng', 'Khớp gối/háng', 'Khớp nhỏ bàn tay/chân', 'Đau cơ bắp', 'Đau sau chấn thương']
      },
      {
        id: 'msk_sign',
        text: 'Dấu hiệu tại khớp?',
        type: 'single',
        options: ['Không sưng', 'Sưng nóng đỏ đau', 'Cứng khớp buổi sáng', 'Biến dạng khớp', 'Kêu lạo xạo khi vận động']
      }
    ]
  },
  {
    id: 'genitourinary',
    label: 'Nhóm Tiết niệu – Sinh dục',
    keywords: ['tiểu', 'thận', 'sinh dục', 'kinh nguyệt', 'bàng quang', 'hông lưng'],
    icon: <Droplet className="w-6 h-6 text-sky-400"/>,
    bodyPart: 'pelvis',
    questions: [
      {
        id: 'gu_urine',
        text: 'Rối loạn tiểu tiện?',
        type: 'multiple',
        options: ['Tiểu buốt/Tiểu rắt', 'Tiểu ra máu', 'Tiểu đêm nhiều', 'Tiểu không tự chủ', 'Bí tiểu']
      },
      {
        id: 'gu_pain',
        text: 'Đau vùng hông/lưng?',
        type: 'single',
        options: ['Không', 'Đau âm ỉ thắt lưng', 'Đau quặn dữ dội từng cơn (Cơn đau quặn thận)', 'Đau vùng hạ vị']
      },
      {
        id: 'gu_sex',
        text: 'Vấn đề sinh dục (Nam/Nữ)?',
        type: 'multiple',
        options: ['Không', 'Ra khí hư/dịch bất thường', 'Rối loạn kinh nguyệt', 'Đau/Sưng bộ phận sinh dục', 'Ngứa vùng kín']
      }
    ]
  },
  {
    id: 'endocrine',
    label: 'Nhóm Nội tiết – Chuyển hóa',
    keywords: ['tiểu đường', 'tuyến giáp', 'mệt mỏi', 'sụt cân', 'béo phì', 'khát', 'run tay'],
    icon: <Zap className="w-6 h-6 text-yellow-500"/>,
    bodyPart: 'systemic',
    questions: [
      {
        id: 'endo_weight',
        text: 'Thay đổi cân nặng?',
        type: 'single',
        options: ['Ổn định', 'Sụt cân nhanh không rõ lý do', 'Tăng cân nhanh']
      },
      {
        id: 'endo_general',
        text: 'Triệu chứng toàn thân?',
        type: 'multiple',
        options: ['Ăn nhiều/Uống nhiều/Tiểu nhiều', 'Run tay', 'Nhịp tim nhanh', 'Chịu nóng/lạnh kém', 'Mệt mỏi kiệt sức']
      }
    ]
  },
  {
    id: 'dermatology',
    label: 'Nhóm Da – Mô mềm – Dị ứng',
    keywords: ['da', 'ngứa', 'mẩn đỏ', 'phát ban', 'mề đay', 'dị ứng', 'mụn'],
    icon: <Shield className="w-6 h-6 text-pink-500"/>,
    bodyPart: 'limbs',
    questions: [
      {
        id: 'derm_lesion',
        text: 'Tổn thương da?',
        type: 'multiple',
        options: ['Mẩn đỏ/Phát ban', 'Mụn nước/Phồng rộp', 'Lở loét', 'Sưng nề (Môi/Mắt)', 'Nổi cục/u']
      },
      {
        id: 'derm_feel',
        text: 'Cảm giác?',
        type: 'single',
        options: ['Bình thường', 'Ngứa nhiều', 'Đau rát', 'Mất cảm giác']
      }
    ]
  },
  {
    id: 'hematology',
    label: 'Nhóm Huyết học – Miễn dịch',
    keywords: ['máu', 'bầm tím', 'hạch', 'sốt kéo dài', 'nhiễm trùng', 'miễn dịch'],
    icon: <Activity className="w-6 h-6 text-rose-700"/>,
    bodyPart: 'systemic',
    questions: [
      {
        id: 'hema_bleed',
        text: 'Dấu hiệu xuất huyết?',
        type: 'multiple',
        options: ['Không', 'Chảy máu cam/Chân răng', 'Vết bầm tím tự nhiên trên da', 'Kinh nguyệt kéo dài/nhiều', 'Xuất huyết dưới da']
      },
      {
        id: 'hema_other',
        text: 'Dấu hiệu khác?',
        type: 'multiple',
        options: ['Sốt kéo dài không rõ nguyên nhân', 'Nổi hạch (Cổ, nách, bẹn)', 'Da xanh xao/Nhợt nhạt', 'Hay bị nhiễm trùng']
      }
    ]
  }
];

const EPIDEMIOLOGY_QUESTIONS: Question[] = [
  {
    id: 'epi_risk',
    text: 'Yếu tố nguy cơ & Dịch tễ:',
    type: 'multiple',
    options: [
      'Không rõ',
      'Tiếp xúc người mắc bệnh truyền nhiễm (Cúm, COVID, Sởi...)',
      'Sống/Đến vùng có Sốt xuất huyết/Sốt rét',
      'Ăn thực phẩm lạ/tươi sống gần đây',
      'Quan hệ tình dục không an toàn',
      'Tiền sử gia đình có bệnh di truyền'
    ]
  }
];

// --- Components for Interactive Body ---

const HumanBodyMap: React.FC<{ 
  onSelect: (part: string) => void, 
  selectedPart: string | null,
  hoverPart: string | null,
  setHoverPart: (part: string | null) => void
}> = ({ onSelect, selectedPart, hoverPart, setHoverPart }) => {
  
  const getFill = (part: string) => {
    if (selectedPart === part) return '#0d9488'; // teal-600
    if (hoverPart === part) return '#5eead4'; // teal-300
    return '#e2e8f0'; // slate-200
  };

  const baseClass = "cursor-pointer transition-all duration-300 stroke-white stroke-2 hover:filter hover:brightness-95";

  return (
    <div className="relative w-48 h-96 mx-auto select-none">
      <svg viewBox="0 0 200 420" className="w-full h-full drop-shadow-xl">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Head */}
        <path 
          d="M100 10 Q130 10 130 45 Q130 75 100 75 Q70 75 70 45 Q70 10 100 10" 
          fill={getFill('head')} 
          className={baseClass}
          onClick={() => onSelect('head')}
          onMouseEnter={() => setHoverPart('head')}
          onMouseLeave={() => setHoverPart(null)}
        />
        
        {/* Chest */}
        <path 
          d="M70 80 L130 80 L135 140 L65 140 Z" 
          fill={getFill('chest')} 
          className={baseClass}
          onClick={() => onSelect('chest')}
          onMouseEnter={() => setHoverPart('chest')}
          onMouseLeave={() => setHoverPart(null)}
        />

        {/* Abdomen */}
        <path 
          d="M65 145 L135 145 L130 200 L70 200 Z" 
          fill={getFill('abdomen')} 
          className={baseClass}
          onClick={() => onSelect('abdomen')}
          onMouseEnter={() => setHoverPart('abdomen')}
          onMouseLeave={() => setHoverPart(null)}
        />

        {/* Pelvis (Genitals) */}
        <path 
          d="M70 205 L130 205 L115 235 L85 235 Z" 
          fill={getFill('pelvis')} 
          className={baseClass}
          onClick={() => onSelect('pelvis')}
          onMouseEnter={() => setHoverPart('pelvis')}
          onMouseLeave={() => setHoverPart(null)}
        />

        {/* Arms */}
        <g
          onClick={() => onSelect('limbs')}
          onMouseEnter={() => setHoverPart('limbs')}
          onMouseLeave={() => setHoverPart(null)}
        >
            <path d="M135 80 L165 85 L175 180 L155 185 L140 145 Z" fill={getFill('limbs')} className={baseClass}/>
            <path d="M65 80 L35 85 L25 180 L45 185 L60 145 Z" fill={getFill('limbs')} className={baseClass}/>
        </g>

        {/* Legs */}
        <g
          onClick={() => onSelect('limbs')}
          onMouseEnter={() => setHoverPart('limbs')}
          onMouseLeave={() => setHoverPart(null)}
        >
            <path d="M85 240 L100 240 L100 390 L80 390 Z" fill={getFill('limbs')} className={baseClass}/>
            <path d="M100 240 L115 240 L120 390 L100 390 Z" fill={getFill('limbs')} className={baseClass}/>
        </g>
      </svg>
      
      {/* Labels */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[9px] text-slate-500 pointer-events-none font-bold opacity-70">ĐẦU</div>
      <div className="absolute top-24 left-1/2 -translate-x-1/2 text-[9px] text-slate-500 pointer-events-none font-bold opacity-70">NGỰC</div>
      <div className="absolute top-44 left-1/2 -translate-x-1/2 text-[9px] text-slate-500 pointer-events-none font-bold opacity-70">BỤNG</div>
      <div className="absolute top-[215px] left-1/2 -translate-x-1/2 text-[8px] text-slate-500 pointer-events-none font-bold opacity-70">HẠ VỊ</div>
    </div>
  );
};

const ScreeningForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  // Steps: 'dashboard' is the unified start screen, 'questions' is the wizard
  const [step, setStep] = useState<'dashboard' | 'questions'>('dashboard');
  
  // Profile Data
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [location, setLocation] = useState<string>('');
  const [medicalHistory, setMedicalHistory] = useState<string[]>([]);
  const [showProfileError, setShowProfileError] = useState(false);

  // Symptom Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // This filter controls which categories are shown in the grid
  const [bodyPartFilter, setBodyPartFilter] = useState<string | null>(null);
  const [hoverBodyPart, setHoverBodyPart] = useState<string | null>(null);
  
  // Answers
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Validate Profile
  const checkProfile = () => {
    if (!age || !location) {
      setShowProfileError(true);
      return false;
    }
    setShowProfileError(false);
    return true;
  };

  // Handlers
  const handleBodySelect = (part: string) => {
    // Just filter the list, don't force select yet
    setBodyPartFilter(part === bodyPartFilter ? null : part);
  };

  const handleCategorySelect = (catId: string) => {
    if (!checkProfile()) return;
    setSelectedCategory(catId);
    setStep('questions');
  };

  const toggleMedicalHistory = (item: string) => {
    setMedicalHistory(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  // Filter Categories based on search OR body part filter OR hover body part
  const displayCategories = CATEGORY_FLOWS.filter(cat => {
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      return cat.label.toLowerCase().includes(lower) || cat.keywords.some(k => k.includes(lower));
    }
    
    // Priority: Selected Filter -> Hover -> Show All
    const filterPart = bodyPartFilter || hoverBodyPart;
    
    if (filterPart) {
      if (filterPart === 'head') return cat.bodyPart === 'head';
      if (filterPart === 'chest') return cat.bodyPart === 'chest'; // Matches Resp & Cardio
      if (filterPart === 'abdomen') return cat.bodyPart === 'abdomen';
      if (filterPart === 'pelvis') return cat.bodyPart === 'pelvis';
      if (filterPart === 'limbs') return cat.bodyPart === 'limbs' || cat.bodyPart === 'systemic'; // Include Derma/Systemic often
      if (filterPart === 'systemic') return cat.bodyPart === 'systemic' || cat.bodyPart === 'chest'; // Include Heart/Endo/Hema
    }
    return true;
  });

  // Question Logic
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  useEffect(() => {
    if (selectedCategory) {
      const specificQ = CATEGORY_FLOWS.find(c => c.id === selectedCategory)?.questions || [];
      setCurrentQuestions([...GENERAL_QUESTIONS, ...specificQ, ...EPIDEMIOLOGY_QUESTIONS]);
    }
  }, [selectedCategory]);

  const handleAnswer = (id: string, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleFinish = () => {
    let narrative = `BỆNH NHÂN: ${gender}, ${age} tuổi. Khu vực: ${location}.\n`;
    narrative += `TIỀN SỬ: ${medicalHistory.join(', ') || 'Không'}.\n`;
    narrative += `NHÓM BỆNH: ${CATEGORY_FLOWS.find(c => c.id === selectedCategory)?.label}.\n`;
    currentQuestions.forEach(q => {
      const ans = answers[q.id];
      if (ans) narrative += `- ${q.text}: ${Array.isArray(ans) ? ans.join(', ') : ans}\n`;
    });

    onSubmit({
      age: Number(age),
      gender,
      location,
      medicalHistory,
      chiefComplaint: CATEGORY_FLOWS.find(c => c.id === selectedCategory)?.label || 'Khác',
      symptomDetails: answers,
      duration: answers['symptom_duration'] || 'Unknown',
      severity: Number(answers['pain_level'] || 0),
      generatedNarrative: narrative
    });
  };

  // --- RENDER DASHBOARD ---
  const renderDashboard = () => (
    <div className="animate-fade-in">
      {/* Top Bar: Quick Profile */}
      <div className={`bg-teal-50 p-4 rounded-xl border ${showProfileError ? 'border-red-400 ring-2 ring-red-200' : 'border-teal-100'} mb-6 transition-all`}>
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
            <div>
              <label className="text-xs font-bold text-teal-800 uppercase block mb-1">Tuổi *</label>
              <input 
                type="number" 
                value={age} 
                onChange={e => { setAge(e.target.value); if(e.target.value) setShowProfileError(false); }} 
                className="w-full p-2 rounded border border-teal-200 focus:ring-2 focus:ring-teal-500 outline-none" 
                placeholder="VD: 30"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-teal-800 uppercase block mb-1">Giới tính</label>
              <select 
                value={gender} 
                onChange={e => setGender(e.target.value as Gender)} 
                className="w-full p-2 rounded border border-teal-200 focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value={Gender.MALE}>Nam</option>
                <option value={Gender.FEMALE}>Nữ</option>
              </select>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs font-bold text-teal-800 uppercase block mb-1">Khu vực (Tỉnh/TP) *</label>
              <input 
                type="text" 
                value={location} 
                onChange={e => { setLocation(e.target.value); if(e.target.value) setShowProfileError(false); }} 
                className="w-full p-2 rounded border border-teal-200 focus:ring-2 focus:ring-teal-500 outline-none" 
                placeholder="VD: HCM"
              />
            </div>
          </div>
        </div>
        {showProfileError && <p className="text-red-600 text-xs mt-2 font-bold flex items-center"><AlertCircle size={12} className="mr-1"/> Vui lòng nhập đủ Tuổi và Khu vực.</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Body Map (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col items-center bg-white border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <UserCircle className="text-teal-600"/> Mô phỏng cơ thể
          </h3>
          <HumanBodyMap 
            onSelect={handleBodySelect} 
            selectedPart={bodyPartFilter} 
            hoverPart={hoverBodyPart}
            setHoverPart={setHoverBodyPart}
          />
          
          <button 
             onClick={() => setBodyPartFilter('systemic')}
             className={`mt-6 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                bodyPartFilter === 'systemic' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
             }`}
          >
             Bệnh toàn thân / Khác
          </button>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Chạm vào vùng cơ thể (Đầu, Ngực, Bụng...) để lọc nhanh nhóm bệnh lý phù hợp.
          </p>
        </div>

        {/* Right: Search & Categories (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
           {/* Search */}
           <div className="relative group">
            <Search className="absolute left-4 top-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Tìm triệu chứng (VD: đau ngực, tiểu buốt, nổi mẩn...)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:border-teal-500 focus:ring-4 focus:ring-teal-50 outline-none transition-all text-lg"
            />
          </div>

          {/* Category Grid */}
          <div>
            <div className="flex justify-between items-end mb-3">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                {bodyPartFilter ? `Nhóm bệnh vùng ${
                  bodyPartFilter === 'head' ? 'ĐẦU' : 
                  bodyPartFilter === 'chest' ? 'NGỰC' : 
                  bodyPartFilter === 'abdomen' ? 'BỤNG' :
                  bodyPartFilter === 'pelvis' ? 'HẠ VỊ' :
                  bodyPartFilter === 'limbs' ? 'TAY CHÂN' : 'TOÀN THÂN'
                }` : 'Tất cả danh mục'}
              </h4>
              {bodyPartFilter && (
                <button onClick={() => setBodyPartFilter(null)} className="text-xs text-teal-600 hover:underline font-medium">
                  Xem tất cả
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
              {displayCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-teal-500 hover:shadow-md transition-all group text-left"
                >
                  <div className="p-3 bg-gray-50 rounded-full mr-4 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                    {cat.icon}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-gray-800 group-hover:text-teal-700">{cat.label}</h5>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{cat.keywords.join(', ')}</p>
                  </div>
                  <ArrowRight className="text-gray-300 group-hover:text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" size={18}/>
                </button>
              ))}
              {displayCategories.length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-20"/>
                  Không tìm thấy nhóm bệnh phù hợp.
                  <button onClick={() => {setSearchTerm(''); setBodyPartFilter(null);}} className="block mx-auto mt-2 text-teal-600 font-bold text-sm hover:underline">
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Medical History Tags */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide flex items-center gap-2">
              <Stethoscope size={16}/> Tiền sử bệnh nền (Chọn nếu có)
            </h4>
            <div className="flex flex-wrap gap-2">
              {MEDICAL_HISTORY_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => toggleMedicalHistory(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    medicalHistory.includes(opt) 
                    ? 'bg-teal-600 text-white border-teal-600' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- RENDER QUESTIONS ---
  const renderQuestions = () => (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <button 
        onClick={() => setStep('dashboard')} 
        className="mb-6 text-gray-500 hover:text-teal-600 flex items-center gap-1 text-sm font-medium"
      >
        <ArrowLeft size={16}/> Chọn nhóm bệnh khác
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-teal-600 p-6 text-white">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            {CATEGORY_FLOWS.find(c => c.id === selectedCategory)?.icon}
            {CATEGORY_FLOWS.find(c => c.id === selectedCategory)?.label}
          </h3>
          <p className="text-teal-100 text-sm mt-1">Hãy mô tả chi tiết để AI phân tích chính xác.</p>
        </div>

        <div className="p-8 space-y-8">
          {currentQuestions.map((q, idx) => (
            <div key={q.id} className="space-y-3 pb-6 border-b last:border-0 last:pb-0">
              <label className="block font-semibold text-gray-800 text-lg">
                {idx + 1}. {q.text}
              </label>
              
              {q.type === 'scale' && (
                <div className="px-2">
                  <input 
                    type="range" min="1" max="10" 
                    value={answers[q.id] || 5} 
                    onChange={e => handleAnswer(q.id, e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                    <span>Nhẹ (1)</span>
                    <span className="text-teal-600 text-base font-bold">Mức độ: {answers[q.id] || 5}/10</span>
                    <span>Dữ dội (10)</span>
                  </div>
                </div>
              )}

              {(q.type === 'single' || q.type === 'multiple') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options?.map(opt => {
                    const isMulti = q.type === 'multiple';
                    const currentVal = answers[q.id];
                    const isSelected = isMulti 
                      ? (currentVal || []).includes(opt) 
                      : currentVal === opt;

                    return (
                      <button
                        key={opt}
                        onClick={() => {
                          if (isMulti) {
                             const oldArr = currentVal || [];
                             handleAnswer(q.id, isSelected ? oldArr.filter((x:string) => x!==opt) : [...oldArr, opt]);
                          } else {
                             handleAnswer(q.id, opt);
                          }
                        }}
                        className={`p-3 text-left rounded-xl border transition-all flex items-center ${
                          isSelected 
                          ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500 text-teal-900' 
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                          isSelected ? 'bg-teal-600 border-teal-600' : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <Check size={12} className="text-white"/>}
                        </div>
                        <span className="text-sm font-medium">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
           <button 
             onClick={handleFinish}
             disabled={isLoading}
             className="px-8 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 disabled:opacity-70 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2"
           >
             {isLoading ? 'Đang phân tích...' : 'Xem kết quả chẩn đoán'} <ArrowRight size={20}/>
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {step === 'dashboard' && renderDashboard()}
      {step === 'questions' && renderQuestions()}
    </div>
  );
};

export default ScreeningForm;