import React from 'react';

export interface Template {
  id: string;
  title: string;
  type: 'contract' | 'poa' | 'notice' | 'other';
  content: string; // Using simple placeholder syntax: {{key}}
  placeholders: string[];
  category: 'civil' | 'criminal' | 'family' | 'commercial' | 'administrative' | 'general';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  tags: string[];
  usageCount?: number;
  isPremium?: boolean;
  lastUpdated?: string;
  isMultiPage?: boolean; // New field for multi-page support
  pages?: TemplatePage[]; // New field for individual pages
}

export interface TemplatePage {
  id: string;
  title: string;
  content: string;
  placeholders: string[];
  pageNumber: number;
}

// Export multi-page template type for DocumentGenerator
export interface MultiPageTemplate extends Template {
  isMultiPage: true;
  pages: TemplatePage[];
}

// Enhanced Templates with metadata
export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'lease_agreement',
    title: 'عقد إيجار (سكني/تجاري)',
    type: 'contract',
    category: 'civil',
    difficulty: 'basic',
    tags: ['إيجار', 'عقارات', 'سكني', 'تجاري'],
    usageCount: 127,
    lastUpdated: '2024-03-15',
    placeholders: ['DATE', 'CLIENT_NAME', 'CLIENT_ID', 'CLIENT_ADDRESS', 'SECOND_PARTY_NAME', 'SECOND_PARTY_ID', 'SECOND_PARTY_ADDRESS', 'UNIT_ADDRESS', 'UNIT_DETAILS', 'RENT_AMOUNT', 'SECURITY_DEPOSIT', 'START_DATE', 'DURATION', 'PURPOSE'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">عقد إيجار أملاك</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>تحرر هذا العقد بين كل من:</p>
      <p><strong>أولاً: السيد/ {{CLIENT_NAME}}</strong> المقيم في: {{CLIENT_ADDRESS}} ويحمل رقم قومي: {{CLIENT_ID}} (طرف أول - مؤجر)</p>
      <p><strong>ثانياً: السيد/ {{SECOND_PARTY_NAME}}</strong> المقيم في: {{SECOND_PARTY_ADDRESS}} ويحمل رقم قومي: {{SECOND_PARTY_ID}} (طرف ثاني - مستأجر)</p>
      <br/>
      <h3 style="text-align: center;">التمهيد</h3>
      <p>يقر الطرفان بأهليتهما للتعاقد والتصرف، وقد اتفقا على ما يلي:</p>
      <p><strong>البند الأول:</strong> أجر الطرف الأول للطرف الثاني الشقة/الوحدة الكائنة في: {{UNIT_ADDRESS}} والمكونة من: {{UNIT_DETAILS}} بقصد استعمالها ({{PURPOSE}}).</p>
      <p><strong>البند الثاني:</strong> مدة هذا العقد هي <strong>{{DURATION}}</strong> تبدأ من تاريخ {{START_DATE}} وتنتهي في تاريخ ....................... ولا يجدد هذا العقد إلا بعقد جديد واتفاق جديد.</p>
      <p><strong>البند الثالث:</strong> القيمة الإيجارية الشهرية هي <strong>{{RENT_AMOUNT}} جنيه مصري</strong> تدفع مقدماً أول كل شهر للطرف الأول، وفي حالة التأخير عن الدفع لمدة ............ يعتبر العقد مفسوخاً من تلقاء نفسه دون حاجة إلى تنبيه أو إنذار.</p>
      <p><strong>البند الرابع:</strong> دفع الطرف الثاني للطرف الأول مبلغ وقدره <strong>{{SECURITY_DEPOSIT}} جنيه مصري</strong> كتأمين، يرد عند انتهاء العقد وتسليم العين بالحالة التي كانت عليها وقت التعاقد.</p>
      <p><strong>البند الخامس:</strong> يقر الطرف الثاني بأنه عاين العين المؤجرة المعاينة التامة النافية للجهالة وقبلها بحالتها الحالية، ويتعهد بالمحافظة عليها وصيانتها.</p>
      <p><strong>البند السادس:</strong> لا يجوز للمستأجر تأجير العين من الباطن أو التنازل عنها للغير دون موافقة كتابية من المؤجر.</p>
      <p><strong>البند السابع:</strong> تختص محكمة ............ بالنظر في أي نزاع ينشأ عن هذا العقد.</p>
      <p><strong>البند الثامن:</strong> تحرر هذا العقد من نسختين، بيد كل طرف نسخة للعمل بموجبها.</p>
      <br/><br/>
      <div style="display: flex; justify-content: space-between; margin-top: 50px;">
        <div style="text-align: center;"><strong>الطرف الأول (المؤجر)</strong><br/><br/>...................</div>
        <div style="text-align: center;"><strong>الطرف الثاني (المستأجر)</strong><br/><br/>...................</div>
      </div>
    `
  },
  {
    id: 'employment_contract',
    title: 'عقد عمل (محدد المدة)',
    type: 'contract',
    category: 'commercial',
    difficulty: 'intermediate',
    tags: ['عمل', 'موظف', 'شركة', 'راتب'],
    usageCount: 89,
    lastUpdated: '2024-03-10',
    placeholders: ['DATE', 'EMPLOYER_NAME', 'EMPLOYER_ADDRESS', 'EMPLOYEE_NAME', 'EMPLOYEE_ID', 'EMPLOYEE_ADDRESS', 'JOB_TITLE', 'SALARY', 'START_DATE', 'CONTRACT_DURATION', 'PROBATION_PERIOD'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">عقد عمل محدد المدة</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>تحرر هذا العقد بين كل من:</p>
      <p><strong>أولاً: شركة/السيد: {{EMPLOYER_NAME}}</strong> ومقرها: {{EMPLOYER_ADDRESS}} (طرف أول - صاحب العمل)</p>
      <p><strong>ثانياً: السيد/ {{EMPLOYEE_NAME}}</strong> المقيم في: {{EMPLOYEE_ADDRESS}} ويحمل رقم قومي: {{EMPLOYEE_ID}} (طرف ثاني - عامل)</p>
      <br/>
      <h3 style="text-align: center;">بنود العقد</h3>
      <p><strong>البند الأول:</strong> يعين الطرف الأول الطرف الثاني للعمل لديه في وظيفة <strong>{{JOB_TITLE}}</strong>، ويتعهد الطرف الثاني بأداء واجبات وظيفته بأمانة وإخلاص.</p>
      <p><strong>البند الثاني:</strong> مدة هذا العقد هي <strong>{{CONTRACT_DURATION}}</strong> تبدأ من تاريخ {{START_DATE}} وتنتهي في .......................، ويجوز تجديدها باتفاق الطرفين.</p>
      <p><strong>البند الثالث:</strong> يخضع الطرف الثاني لفترة اختبار مدتها <strong>{{PROBATION_PERIOD}}</strong>، ويجوز للطرف الأول إنهاء العقد خلال هذه الفترة دون إنذار أو تعويض إذا ثبت عدم صلاحية الطرف الثاني للعمل.</p>
      <p><strong>البند الرابع:</strong> يتقاضى الطرف الثاني راتباً شهرياً شاملاً قدره <strong>{{SALARY}} جنيه مصري</strong>، يصرف في نهاية كل شهر.</p>
      <p><strong>البند الخامس:</strong> يلتزم الطرف الثاني بمواعيد العمل الرسمية المحددة من قبل الشركة، وكذلك بتنفيذ تعليمات الرؤساء والمحافظة على أسرار العمل.</p>
      <p><strong>البند السادس:</strong> يستحق الطرف الثاني إجازة سنوية مدفوعة الأجر مدتها 21 يوماً بعد مرور سنة كاملة في الخدمة، وتزداد إلى 30 يوماً بعد مرور 10 سنوات أو تجاوز سن الخمسين.</p>
      <p><strong>البند السابع:</strong> تختص المحكمة العمالية بنظر أي نزاع ينشأ عن هذا العقد.</p>
      <p><strong>البند الثامن:</strong> تحرر هذا العقد من ثلاث نسخ، بيد كل طرف نسخة وأودعت النسخة الثالثة بمكتب التأمينات الاجتماعية المختص.</p>
      <br/><br/>
      <div style="display: flex; justify-content: space-between; margin-top: 50px;">
        <div style="text-align: center;"><strong>الطرف الأول (صاحب العمل)</strong><br/><br/>...................</div>
        <div style="text-align: center;"><strong>الطرف الثاني (العامل)</strong><br/><br/>...................</div>
      </div>
    `
  },
  {
    id: 'apartment_sale_contract',
    title: 'عقد بيع شقة سكنية (نهائي)',
    type: 'contract',
    category: 'civil',
    difficulty: 'intermediate',
    tags: ['بيع', 'شقة', 'عقاري', 'ملكية'],
    usageCount: 156,
    lastUpdated: '2024-03-12',
    placeholders: ['DATE', 'SELLER_NAME', 'SELLER_ID', 'SELLER_ADDRESS', 'BUYER_NAME', 'BUYER_ID', 'BUYER_ADDRESS', 'APARTMENT_ADDRESS', 'APARTMENT_AREA', 'FLOOR_NUMBER', 'TOTAL_PRICE', 'PAID_AMOUNT', 'REMAINING_AMOUNT'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">عقد بيع شقة سكنية</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>تحرر هذا العقد بين كل من:</p>
      <p><strong>أولاً: السيد/ {{SELLER_NAME}}</strong> المقيم في: {{SELLER_ADDRESS}} ويحمل رقم قومي: {{SELLER_ID}} (طرف أول - بائع)</p>
      <p><strong>ثانياً: السيد/ {{BUYER_NAME}}</strong> المقيم في: {{BUYER_ADDRESS}} ويحمل رقم قومي: {{BUYER_ID}} (طرف ثاني - مشتري)</p>
      <br/>
      <h3 style="text-align: center;">التمهيد</h3>
      <p>يمتلك الطرف الأول الشقة السكنية الكائنة في: {{APARTMENT_ADDRESS}} بالدور {{FLOOR_NUMBER}} والبالغ مساحتها {{APARTMENT_AREA}} متر مربع تقريباً، ورغب الطرف الأول في بيعها للطرف الثاني الذي قبل شراءها وفقاً للبنود التالية:</p>
      <p><strong>البند الأول:</strong> يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد.</p>
      <p><strong>البند الثاني:</strong> باع وأسقط وتنازل الطرف الأول بكافة الضمانات الفعلية والقانونية للطرف الثاني القابل لذلك الشقة الموضحة بالتمهيد.</p>
      <p><strong>البند الثالث:</strong> تم هذا البيع نظير ثمن إجمالي قدره <strong>{{TOTAL_PRICE}} جنيه مصري</strong>.</p>
      <p><strong>البند الرابع:</strong> دفع الطرف الثاني للطرف الأول مبلغ وقدره <strong>{{PAID_AMOUNT}} جنيه مصري</strong> عند التوقيع على هذا العقد، والباقي وقدره <strong>{{REMAINING_AMOUNT}} جنيه مصري</strong> يسدد على النحو التالي: ........................................................</p>
      <p><strong>البند الخامس:</strong> يقر الطرف الثاني بأنه عاين الشقة المبيعة المعاينة التامة النافية للجهالة وقبلها بحالتها الراهنة.</p>
      <p><strong>البند السادس:</strong> يلتزم الطرف الأول بتسليم الشقة للطرف الثاني خالية من الأشخاص والشواغل في موعد أقصاه .......................، كما يلتزم بتقديم كافة المستندات اللازمة لنقل الملكية وتسجيل العقد.</p>
      <p><strong>البند السابع:</strong> يقر الطرف الأول بخلو الشقة من كافة الحقوق العينية الأصلية والتبعية كالرهن والاختصاص والامتياز، وأنها ليست موقوفة ولا محكورة.</p>
      <p><strong>البند الثامن:</strong> تختص محكمة ............ بنظر أي نزاع ينشأ حول تنفيذ أو تفسير بنود هذا العقد.</p>
      <br/><br/>
      <div style="display: flex; justify-content: space-between; margin-top: 50px;">
        <div style="text-align: center;"><strong>الطرف الأول (البائع)</strong><br/><br/>...................</div>
        <div style="text-align: center;"><strong>الطرف الثاني (المشتري)</strong><br/><br/>...................</div>
      </div>
    `
  },
  {
    id: 'car_sale_contract',
    title: 'عقد بيع سيارة',
    type: 'contract',
    category: 'civil',
    difficulty: 'basic',
    tags: ['بيع', 'سيارة', 'مركبات', 'نقل ملكية'],
    usageCount: 203,
    lastUpdated: '2024-03-08',
    placeholders: ['DATE', 'SELLER_NAME', 'SELLER_ID', 'SELLER_ADDRESS', 'BUYER_NAME', 'BUYER_ID', 'BUYER_ADDRESS', 'CAR_MAKE', 'CAR_MODEL', 'CAR_YEAR', 'CAR_PLATE', 'CAR_CHASSIS', 'CAR_MOTOR', 'CAR_COLOR', 'PRICE'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">عقد بيع سيارة</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>تحرر هذا العقد بين كل من:</p>
      <p><strong>أولاً: السيد/ {{SELLER_NAME}}</strong> المقيم في: {{SELLER_ADDRESS}} ويحمل رقم قومي: {{SELLER_ID}} (طرف أول - بائع)</p>
      <p><strong>ثانياً: السيد/ {{BUYER_NAME}}</strong> المقيم في: {{BUYER_ADDRESS}} ويحمل رقم قومي: {{BUYER_ID}} (طرف ثاني - مشتري)</p>
      <br/>
      <h3 style="text-align: center;">البنود</h3>
      <p><strong>البند الأول:</strong> باع الطرف الأول للطرف الثاني السيارة رقم ({{CAR_PLATE}}) ماركة ({{CAR_MAKE}}) موديل ({{CAR_MODEL}}) سنة الصنع ({{CAR_YEAR}}) شاسيه رقم ({{CAR_CHASSIS}}) موتور رقم ({{CAR_MOTOR}}) لون ({{CAR_COLOR}}).</p>
      <p><strong>البند الثاني:</strong> تم هذا البيع نظير ثمن إجمالي قدره <strong>{{PRICE}} جنيه مصري</strong>، دفعه الطرف الثاني للطرف الأول عداً ونقداً بمجلس العقد، ويعتبر توقيع الطرف الأول على هذا العقد بمثابة مخالصة تامة بالثمن.</p>
      <p><strong>البند الثالث:</strong> يقر الطرف الثاني بأنه عاين السيارة المبيعة المعاينة التامة النافية للجهالة وقبلها بحالتها الراهنة (كما هي) وتحت مسؤوليته.</p>
      <p><strong>البند الرابع:</strong> يقر الطرف الأول بأن السيارة المبيعة ملك خالص له، وأنه لا يوجد عليها أي حظر بيع أو أقساط أو مستحقات للغير أو للجمارك أو للضرائب حتى تاريخ تحرير هذا العقد.</p>
      <p><strong>البند الخامس:</strong> يلتزم الطرف الأول بعمل توكيل رسمي بالبيع للنفس والغير للطرف الثاني أو الحضور أمام الشهر العقاري لنقل الملكية خلال مدة أقصاه ............ يوم من تاريخه.</p>
      <p><strong>البند السادس:</strong> يتحمل الطرف الثاني كافة المخالفات المرورية والرسوم والضرائب المتعلقة بالسيارة اعتباراً من تاريخ وساعة استلام السيارة وتحرير هذا العقد.</p>
      <p><strong>البند السابع:</strong> تحرر هذا العقد من نسختين، بيد كل طرف نسخة للعمل بموجبها.</p>
      <br/><br/>
      <div style="display: flex; justify-content: space-between; margin-top: 50px;">
        <div style="text-align: center;"><strong>الطرف الأول (البائع)</strong><br/><br/>...................</div>
        <div style="text-align: center;"><strong>الطرف الثاني (المشتري)</strong><br/><br/>...................</div>
      </div>
    `
  },
  {
    id: 'general_poa',
    title: 'توكيل رسمي عام قضايا',
    type: 'poa',
    category: 'general',
    difficulty: 'basic',
    tags: ['توكيل', 'محامي', 'قضايا', 'نيابة'],
    usageCount: 178,
    lastUpdated: '2024-03-14',
    placeholders: ['CLIENT_NAME', 'CLIENT_ID', 'CLIENT_ADDRESS', 'LAWYER_NAME'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px;">توكيل رسمي عام في القضايا</h2>
      <p>أقر أنا الموقع أدناه:</p>
      <p>الاسم: <strong>{{CLIENT_NAME}}</strong></p>
      <p>الجنسية: مصري - الديانة: مسلم</p>
      <p>الثابت الشخصية بموجب رقم قومي: <strong>{{CLIENT_ID}}</strong></p>
      <p>المقيم في: {{CLIENT_ADDRESS}}</p>
      <br/>
      <p>أنني قد وكلت الأستاذ/ <strong>{{LAWYER_NAME}}</strong> المحامي.</p>
      <br/>
      <p>في الحضور والمرافعة عني أمام جميع المحاكم بجميع أنواعها ودرجاتها (الجزئية والابتدائية والاستئناف والنقض) ومحاكم القضاء الإداري ومجلس الدولة، وفي تقديم المذكرات والطعون واستلام الأحكام وتنفيذها.</p>
      <p>كما وكلته في الصلح والإقرار والإنكار والإبراء والتحكيم والطعن بالتزوير، وفي استلام الأوراق والمستندات، وفي التوقيع نيابة عني على كافة الأوراق اللازمة لذلك.</p>
      <br/><br/>
      <p style="text-align: left;">توقيع الموكل: .......................</p>
    `
  },
  {
    id: 'warning_notice',
    title: 'إنذار على يد محضر',
    type: 'notice',
    category: 'civil',
    difficulty: 'intermediate',
    tags: ['إنذار', 'محضر', 'قانوني', 'تنبيه'],
    usageCount: 92,
    lastUpdated: '2024-03-11',
    placeholders: ['DATE', 'CLIENT_NAME', 'LAWYER_NAME', 'OPPONENT_NAME', 'OPPONENT_ADDRESS', 'AMOUNT', 'REASON', 'DEADLINE_DAYS'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px;">إنذار على يد محضر</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>بناءً على طلب السيد/ <strong>{{CLIENT_NAME}}</strong></p>
      <p>ومحله المختار مكتب الأستاذ/ <strong>{{LAWYER_NAME}}</strong> المحامي.</p>
      <br/>
      <p>أنا ............ محضر محكمة ............ قد انتقلت وأعلنت:</p>
      <p>السيد/ <strong>{{OPPONENT_NAME}}</strong> المقيم في: {{OPPONENT_ADDRESS}}</p>
      <br/>
      <h3 style="text-align: center;">الموضوع</h3>
      <p>ينذر الطالب المعلن إليه بضرورة سداد مبلغ وقدره <strong>{{AMOUNT}}</strong> وذلك قيمة {{REASON}}.</p>
      <p>حيث أن الطالب قد طالب المعلن إليه مراراً وتكراراً بالطرق الودية إلا أنه امتنع دون وجه حق.</p>
      <p>لذا، ينبه الطالب على المعلن إليه بضرورة السداد خلال <strong>({{DEADLINE_DAYS}}) يوماً</strong> من تاريخ استلام هذا الإنذار، وإلا سيضطر الطالب لاتخاذ كافة الإجراءات القانونية القبلية والمدنية والجنائية ضده، مع تحميله كافة المصروفات والأتعاب.</p>
      <br/>
      <h3 style="text-align: center;">بناءً عليه</h3>
      <p>أنا المحضر سالف الذكر قد انتقلت وسلمت صورة من هذا الإنذار للمعلن إليه للعلم بما جاء به ونفاذ مفعوله في مواجهته.</p>
      <p>ولأجل العلم....</p>
    `
  },
  {
    id: 'marriage_contract',
    title: 'عقد زواج',
    type: 'contract',
    category: 'family',
    difficulty: 'basic',
    tags: ['زواج', 'أسرة', 'عقد', 'زوجين'],
    usageCount: 89,
    lastUpdated: '2024-03-20',
    placeholders: ['DATE', 'HUSBAND_NAME', 'HUSBAND_ID', 'HUSBAND_ADDRESS', 'WIFE_NAME', 'WIFE_ID', 'WIFE_ADDRESS', 'WITNESS1_NAME', 'WITNESS1_ID', 'WITNESS2_NAME', 'WITNESS2_ID', 'MAHR_AMOUNT', 'MAHR_PAYMENT_METHOD'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">عقد زواج</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>تم عقد الزواج بين كل من:</p>
      <p><strong>الزوج:</strong> {{HUSBAND_NAME}} البالغ من العمر راشد، يحمل رقم قومي: {{HUSBAND_ID}} ويقيم في: {{HUSBAND_ADDRESS}}</p>
      <p><strong>الزوجة:</strong> {{WIFE_NAME}} البالغة من العمر راشدة، تحمل رقم قومي: {{WIFE_ID}} وتقيم في: {{WIFE_ADDRESS}}</p>
      <br/>
      <p>وبحضور الشاهدين:</p>
      <p>1. {{WITNESS1_NAME}} يحمل رقم قومي: {{WITNESS1_ID}}</p>
      <p>2. {{WITNESS2_NAME}} يحمل رقم قومي: {{WITNESS2_ID}}</p>
      <br/>
      <p>وقد اتفق الطرفان على ما يلي:</p>
      <p>- الصداق المقدم: <strong>{{MAHR_AMOUNT}}</strong> {{MAHR_PAYMENT_METHOD}}</p>
      <p>- تم العقد برضى الطرفين الكامل وبإرادتهما الحرة</p>
      <p>- يثبت الشاهدان على صحة ما ورد بهذا العقد</p>
      <br/>
      <p style="text-align: center;">حرر في: {{DATE}}</p>
    `
  },
  {
    id: 'divorce_contract',
    title: 'عقد طلاق',
    type: 'contract',
    category: 'family',
    difficulty: 'intermediate',
    tags: ['طلاق', 'أسرة', 'انفصال', 'زوجين'],
    usageCount: 67,
    lastUpdated: '2024-03-20',
    placeholders: ['DATE', 'HUSBAND_NAME', 'HUSBAND_ID', 'WIFE_NAME', 'WIFE_ID', 'DIVORCE_REASON', 'CUSTODY_ARRANGEMENT', 'FINANCIAL_SETTLEMENT', 'WITNESS1_NAME', 'WITNESS1_ID', 'WITNESS2_NAME', 'WITNESS2_ID'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">عقد طلاق</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>تم الطلاق بين كل من:</p>
      <p><strong>الزوج:</strong> {{HUSBAND_NAME}} يحمل رقم قومي: {{HUSBAND_ID}}</p>
      <p><strong>الزوجة:</strong> {{WIFE_NAME}} تحمل رقم قومي: {{WIFE_ID}}</p>
      <br/>
      <p><strong>سبب الطلاق:</strong> {{DIVORCE_REASON}}</p>
      <br/>
      <p><strong>الاتفاقات:</strong></p>
      <p>- الحضانة: {{CUSTODY_ARRANGEMENT}}</p>
      <p>- التسوية المالية: {{FINANCIAL_SETTLEMENT}}</p>
      <br/>
      <p>وبحضور الشاهدين:</p>
      <p>1. {{WITNESS1_NAME}} يحمل رقم قومي: {{WITNESS1_ID}}</p>
      <p>2. {{WITNESS2_NAME}} يحمل رقم قومي: {{WITNESS2_ID}}</p>
      <br/>
      <p style="text-align: center;">حرر في: {{DATE}}</p>
    `
  },
  {
    id: 'company_establishment',
    title: 'عقد شركة (تأسيس)',
    type: 'contract',
    category: 'commercial',
    difficulty: 'advanced',
    tags: ['شركة', 'تأسيس', 'تجاري', 'شركاء'],
    usageCount: 112,
    lastUpdated: '2024-03-20',
    placeholders: ['DATE', 'COMPANY_NAME', 'COMPANY_TYPE', 'COMPANY_ADDRESS', 'PARTNER1_NAME', 'PARTNER1_ID', 'PARTNER1_SHARE', 'PARTNER2_NAME', 'PARTNER2_ID', 'PARTNER2_SHARE', 'CAPITAL_AMOUNT', 'OBJECTIVES', 'MANAGEMENT_STRUCTURE'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">عقد تأسيس شركة</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>تم تأسيس شركة باسم: <strong>{{COMPANY_NAME}}</strong></p>
      <p>نوع الشركة: {{COMPANY_TYPE}}</p>
      <p>عنوان الشركة: {{COMPANY_ADDRESS}}</p>
      <p>رأس المال: {{CAPITAL_AMOUNT}}</p>
      <br/>
      <h3>الشركاء المؤسسون:</h3>
      <p>1. {{PARTNER1_NAME}} - رقم الهوية: {{PARTNER1_ID}} - الحصة: {{PARTNER1_SHARE}}</p>
      <p>2. {{PARTNER2_NAME}} - رقم الهوية: {{PARTNER2_ID}} - الحصة: {{PARTNER2_SHARE}}</p>
      <br/>
      <h3>أهداف الشركة:</h3>
      <p>{{OBJECTIVES}}</p>
      <br/>
      <h3>الهيكل الإداري:</h3>
      <p>{{MANAGEMENT_STRUCTURE}}</p>
      <br/>
      <p style="text-align: center;">حرر في: {{DATE}}</p>
    `
  },
  {
    id: 'lawsuit_summons',
    title: 'دعوى قضائية (استدعاء)',
    type: 'notice',
    category: 'civil',
    difficulty: 'intermediate',
    tags: ['دعوى', 'استدعاء', 'قضائي', 'محكمة'],
    usageCount: 145,
    lastUpdated: '2024-03-20',
    placeholders: ['DATE', 'COURT_NAME', 'CASE_NUMBER', 'PLAINTIFF_NAME', 'PLAINTIFF_ID', 'DEFENDANT_NAME', 'DEFENDANT_ADDRESS', 'SUBJECT', 'CLAIMS', 'LEGAL_BASIS', 'HEARING_DATE'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px;">استدعاء للمدعى عليه</h2>
      <p>إلى محكمة: <strong>{{COURT_NAME}}</strong></p>
      <p>رقم القضية: {{CASE_NUMBER}}</p>
      <p>التاريخ: {{DATE}}</p>
      <br/>
      <p><strong>المدعي:</strong> {{PLAINTIFF_NAME}} - رقم الهوية: {{PLAINTIFF_ID}}</p>
      <p><strong>المدعى عليه:</strong> {{DEFENDANT_NAME}} - العنوان: {{DEFENDANT_ADDRESS}}</p>
      <br/>
      <h3>موضوع الدعوى:</h3>
      <p>{{SUBJECT}}</p>
      <br/>
      <h3>طلبات المدعي:</h3>
      <p>{{CLAIMS}}</p>
      <br/>
      <h3>الأساس القانوني:</h3>
      <p>{{LEGAL_BASIS}}</p>
      <br/>
      <p>لذا، يُستدعى المدعى عليه للحضور في جلسة يوم: <strong>{{HEARING_DATE}}</strong></p>
      <br/>
      <p style="text-align: center;">حرر في: {{DATE}}</p>
    `
  },
  {
    id: 'defense_memo',
    title: 'مذكرة دفاع',
    type: 'other',
    category: 'civil',
    difficulty: 'advanced',
    tags: ['دفاع', 'مذكرة', 'قضائي', 'محاماة'],
    usageCount: 98,
    lastUpdated: '2024-03-20',
    placeholders: ['DATE', 'COURT_NAME', 'CASE_NUMBER', 'DEFENDANT_NAME', 'DEFENDANT_ID', 'LAWYER_NAME', 'DEFENSE_ARGUMENTS', 'EVIDENCE', 'LEGAL_PRECEDENTS', 'REQUESTED_RULING'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px;">مذكرة دفاع</h2>
      <p>إلى محكمة: <strong>{{COURT_NAME}}</strong></p>
      <p>رقم القضية: {{CASE_NUMBER}}</p>
      <p>التاريخ: {{DATE}}</p>
      <br/>
      <p><strong>المدعى عليه:</strong> {{DEFENDANT_NAME}} - رقم الهوية: {{DEFENDANT_ID}}</p>
      <p><strong>المحامي:</strong> {{LAWYER_NAME}}</p>
      <br/>
      <h3>أوجه الدفاع:</h3>
      <p>{{DEFENSE_ARGUMENTS}}</p>
      <br/>
      <h3>الأدلة المقدمة:</h3>
      <p>{{EVIDENCE}}</p>
      <br/>
      <h3>السوابق القضائية:</h3>
      <p>{{LEGAL_PRECEDENTS}}</p>
      <br/>
      <h3>الطلبات:</h3>
      <p>{{REQUESTED_RULING}}</p>
      <br/>
      <p style="text-align: center;">حرر في: {{DATE}}</p>
    `
  },
  {
    id: 'mortgage_contract',
    title: 'عقد رهن',
    type: 'contract',
    category: 'commercial',
    difficulty: 'intermediate',
    tags: ['رهن', 'ضمان', 'عقار', 'تمويل'],
    usageCount: 76,
    lastUpdated: '2024-03-20',
    placeholders: ['DATE', 'LENDER_NAME', 'LENDER_ID', 'BORROWER_NAME', 'BORROWER_ID', 'PROPERTY_ADDRESS', 'PROPERTY_DESCRIPTION', 'LOAN_AMOUNT', 'INTEREST_RATE', 'REPAYMENT_PERIOD', 'COLLATERAL_VALUE'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">عقد رهن</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>تم عقد الرهن بين كل من:</p>
      <p><strong>الدائن (المرتهن):</strong> {{LENDER_NAME}} - رقم الهوية: {{LENDER_ID}}</p>
      <p><strong>المدين (الراهن):</strong> {{BORROWER_NAME}} - رقم الهوية: {{BORROWER_ID}}</p>
      <br/>
      <h3>العقار المرهون:</h3>
      <p>العنوان: {{PROPERTY_ADDRESS}}</p>
      <p>الوصف: {{PROPERTY_DESCRIPTION}}</p>
      <p>قيمة الضمان: {{COLLATERAL_VALUE}}</p>
      <br/>
      <h3>شروط القرض:</h3>
      <p>- مبلغ القرض: {{LOAN_AMOUNT}}</p>
      <p>- سعر الفائدة: {{INTEREST_RATE}}</p>
      <p>- فترة السداد: {{REPAYMENT_PERIOD}}</p>
      <br/>
      <p>يقر المدين برهن العقار المذكور ضماناً للدين</p>
      <br/>
      <p style="text-align: center;">حرر في: {{DATE}}</p>
    `
  },
  {
    id: 'debt_acknowledgment',
    title: 'إقرار بالدين',
    type: 'other',
    category: 'commercial',
    difficulty: 'basic',
    tags: ['دين', 'إقرار', 'مديونية', 'سداد'],
    usageCount: 134,
    lastUpdated: '2024-03-20',
    placeholders: ['DATE', 'DEBTOR_NAME', 'DEBTOR_ID', 'CREDITOR_NAME', 'CREDITOR_ID', 'DEBT_AMOUNT', 'DEBT_REASON', 'PAYMENT_DATE', 'PAYMENT_METHOD', 'WITNESS_NAME', 'WITNESS_ID'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">إقرار بالدين</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>أنا الموقع أدناه:</p>
      <p><strong>الاسم:</strong> {{DEBTOR_NAME}}</p>
      <p><strong>رقم الهوية:</strong> {{DEBTOR_ID}}</p>
      <br/>
      <p>أقر وأعترف بأنني مدين للسيد/ة:</p>
      <p><strong>{{CREDITOR_NAME}}</strong> - رقم الهوية: {{CREDITOR_ID}}</p>
      <br/>
      <p>بمبلغ قدره: <strong>{{DEBT_AMOUNT}}</strong></p>
      <p>سبب الدين: {{DEBT_REASON}}</p>
      <br/>
      <p>وأتعهد بسداد هذا المبلغ في تاريخ: <strong>{{PAYMENT_DATE}}</strong></p>
      <p>طريقة السداد: {{PAYMENT_METHOD}}</p>
      <br/>
      <p>الشاهد: {{WITNESS_NAME}} - رقم الهوية: {{WITNESS_ID}}</p>
      <br/>
      <p style="text-align: center;">حرر في: {{DATE}}</p>
    `
  },
  {
    id: 'special_power_of_attorney',
    title: 'وكالة خاصة',
    type: 'poa',
    category: 'general',
    difficulty: 'basic',
    tags: ['وكالة', 'تفويض', 'ممثل', 'صلاحيات'],
    usageCount: 156,
    lastUpdated: '2024-03-20',
    placeholders: ['DATE', 'PRINCIPAL_NAME', 'PRINCIPAL_ID', 'PRINCIPAL_ADDRESS', 'ATTORNEY_NAME', 'ATTORNEY_ID', 'ATTORNEY_ADDRESS', 'POWERS_GRANTED', 'DURATION', 'TERMS_CONDITIONS', 'WITNESS1_NAME', 'WITNESS1_ID', 'WITNESS2_NAME', 'WITNESS2_ID'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">وكالة خاصة</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>أنا الموقع أدناه:</p>
      <p><strong>الموكل:</strong> {{PRINCIPAL_NAME}} - رقم الهوية: {{PRINCIPAL_ID}}</p>
      <p>العنوان: {{PRINCIPAL_ADDRESS}}</p>
      <br/>
      <p>أفوض وأنيب السيد/ة:</p>
      <p><strong>{{ATTORNEY_NAME}}</strong> - رقم الهوية: {{ATTORNEY_ID}}</p>
      <p>العنوان: {{ATTORNEY_ADDRESS}}</p>
      <br/>
      <h3>الصلاحيات الممنوحة:</h3>
      <p>{{POWERS_GRANTED}}</p>
      <br/>
      <p>مدة الوكالة: {{DURATION}}</p>
      <p>الشروط والأحكام: {{TERMS_CONDITIONS}}</p>
      <br/>
      <p>الشاهدان:</p>
      <p>1. {{WITNESS1_NAME}} - رقم الهوية: {{WITNESS1_ID}}</p>
      <p>2. {{WITNESS2_NAME}} - رقم الهوية: {{WITNESS2_ID}}</p>
      <br/>
      <p style="text-align: center;">حرر في: {{DATE}}</p>
    `
  },
  {
    id: 'waiver_of_rights',
    title: 'تنازل عن حق',
    type: 'other',
    category: 'civil',
    difficulty: 'basic',
    tags: ['تنازل', 'حق', 'إسقاط', 'تنازل'],
    usageCount: 89,
    lastUpdated: '2024-03-20',
    placeholders: ['DATE', 'WAIVER_NAME', 'WAIVER_ID', 'BENEFICIARY_NAME', 'BENEFICIARY_ID', 'RIGHTS_BEING_WAIVED', 'WAIVER_REASON', 'CONSIDERATION', 'EFFECTIVE_DATE', 'WITNESS_NAME', 'WITNESS_ID'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">تنازل عن حق</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>أنا الموقع أدناه:</p>
      <p><strong>الاسم:</strong> {{WAIVER_NAME}} - رقم الهوية: {{WAIVER_ID}}</p>
      <br/>
      <p>أتنازل بمحض إرادتي وحرية اختياري عن جميع حقوقي لصالح:</p>
      <p><strong>{{BENEFICIARY_NAME}}</strong> - رقم الهوية: {{BENEFICIARY_ID}}</p>
      <br/>
      <h3>الحقوق المتنازل عنها:</h3>
      <p>{{RIGHTS_BEING_WAIVED}}</p>
      <br/>
      <p>سبب التنازل: {{WAIVER_REASON}}</p>
      <p>المقابل: {{CONSIDERATION}}</p>
      <p>تاريخ النفاذ: {{EFFECTIVE_DATE}}</p>
      <br/>
      <p>الشاهد: {{WITNESS_NAME}} - رقم الهوية: {{WITNESS_ID}}</p>
      <br/>
      <p style="text-align: center;">حرر في: {{DATE}}</p>
    `
  },
  {
    id: 'donation_contract',
    title: 'عقد هبة',
    type: 'contract',
    category: 'civil',
    difficulty: 'basic',
    tags: ['هبة', 'تبرع', 'منحة', 'عطاء'],
    usageCount: 78,
    lastUpdated: '2024-03-20',
    placeholders: ['DATE', 'DONOR_NAME', 'DONOR_ID', 'DONOR_ADDRESS', 'DONEE_NAME', 'DONEE_ID', 'DONEE_ADDRESS', 'DONATED_ITEM', 'ITEM_DESCRIPTION', 'ITEM_VALUE', 'CONDITIONS', 'ACCEPTANCE_DATE'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px; text-decoration: underline;">عقد هبة</h2>
      <p>إنه في يوم الموافق: <strong>{{DATE}}</strong></p>
      <p>تمت الهبة بين كل من:</p>
      <p><strong>الواهب:</strong> {{DONOR_NAME}} - رقم الهوية: {{DONOR_ID}}</p>
      <p>العنوان: {{DONOR_ADDRESS}}</p>
      <br/>
      <p><strong>الموهوب له:</strong> {{DONEE_NAME}} - رقم الهوية: {{DONEE_ID}}</p>
      <p>العنوان: {{DONEE_ADDRESS}}</p>
      <br/>
      <h3>الموهوب:</h3>
      <p>{{DONATED_ITEM}}</p>
      <p>الوصف: {{ITEM_DESCRIPTION}}</p>
      <p>القيمة: {{ITEM_VALUE}}</p>
      <br/>
      <p>الشروط: {{CONDITIONS}}</p>
      <p>تاريخ القبول: {{ACCEPTANCE_DATE}}</p>
      <br/>
      <p>أقر الواهب بالهبة المذكورة وأقر الموهوب له بالقبول</p>
      <br/>
      <p style="text-align: center;">حرر في: {{DATE}}</p>
    `
  },
  {
    id: 'reconciliation_judgment',
    title: 'حكم صلح',
    type: 'other',
    category: 'civil',
    difficulty: 'intermediate',
    tags: ['صلح', 'حكم', 'توافق', 'فض نزاع'],
    usageCount: 92,
    lastUpdated: '2024-03-20',
    placeholders: ['DATE', 'COURT_NAME', 'CASE_NUMBER', 'JUDGE_NAME', 'PARTY1_NAME', 'PARTY1_ID', 'PARTY2_NAME', 'PARTY2_ID', 'DISPUTE_SUBJECT', 'SETTLEMENT_TERMS', 'OBLIGATIONS', 'ENFORCEMENT_DATE'],
    content: `
      <h2 style="text-align: center; margin-bottom: 20px;">حكم صلح</h2>
      <p>في محكمة: <strong>{{COURT_NAME}}</strong></p>
      <p>رقم القضية: {{CASE_NUMBER}}</p>
      <p>التاريخ: {{DATE}}</p>
      <p>القاضي: {{JUDGE_NAME}}</p>
      <br/>
      <p><strong>أطراف النزاع:</strong></p>
      <p>الطرف الأول: {{PARTY1_NAME}} - رقم الهوية: {{PARTY1_ID}}</p>
      <p>الطرف الثاني: {{PARTY2_NAME}} - رقم الهوية: {{PARTY2_ID}}</p>
      <br/>
      <h3>موضوع النزاع:</h3>
      <p>{{DISPUTE_SUBJECT}}</h3>
      <br/>
      <h3>شروط الصلح:</h3>
      <p>{{SETTLEMENT_TERMS}}</p>
      <br/>
      <h3>الالتزامات:</h3>
      <p>{{OBLIGATIONS}}</p>
      <br/>
      <p>تاريخ النفاذ: {{ENFORCEMENT_DATE}}</p>
      <br/>
      <p>وبناءً على ما تقدم، حكمت المحكمة بإقرار الصلح بين الطرفين</p>
      <br/>
      <p style="text-align: center;">حرر في: {{DATE}}</p>
    `
  }
];

// Helper functions for template management
export const getTemplatesByCategory = (category: string): Template[] => {
  return DEFAULT_TEMPLATES.filter(template => template.category === category);
};

export const getTemplatesByType = (type: string): Template[] => {
  return DEFAULT_TEMPLATES.filter(template => template.type === type);
};

export const getTemplateById = (id: string): Template | undefined => {
  return DEFAULT_TEMPLATES.find(template => template.id === id);
};

export const searchTemplates = (query: string): Template[] => {
  const lowerQuery = query.toLowerCase();
  return DEFAULT_TEMPLATES.filter(template => 
    template.title.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

const LegalTemplates: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">النماذج القانونية</h2>
      <p>هذا المكون يحتوي على تعريفات النماذج والبيانات الثابتة.</p>
    </div>
  );
};
export default LegalTemplates;
