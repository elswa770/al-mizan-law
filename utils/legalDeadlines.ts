import { LawBranch } from '../types';

interface DeadlineCalculation {
  date: string;
  title: string;
  description: string;
  days: number;
}

export const calculateLegalDeadline = (judgmentDate: string, caseType?: LawBranch): DeadlineCalculation | null => {
  if (!judgmentDate || !caseType) return null;

  const date = new Date(judgmentDate);
  let daysToAdd = 0;
  let title = '';
  let typeDescription = '';

  switch (caseType) {
    case 'civil':
    case 'commercial':
    case 'family':
    case 'labor':
      daysToAdd = 40;
      title = 'انتهاء ميعاد الاستئناف';
      typeDescription = ' (مدني/أسرة/عمالي)';
      break;
    case 'criminal':
      // Default to 10 days (Misdemeanor Appeal) as it's the most critical short deadline
      daysToAdd = 10; 
      title = 'انتهاء ميعاد استئناف الجنح';
      typeDescription = ' (جنائي - جنح)';
      break;
    case 'administrative':
      daysToAdd = 60;
      title = 'انتهاء ميعاد الطعن أمام الإدارية العليا';
      typeDescription = ' (قضاء إداري)';
      break;
    default:
      return null;
  }

  date.setDate(date.getDate() + daysToAdd);
  
  return {
    date: date.toISOString().split('T')[0],
    title: title,
    description: `الموعد النهائي للطعن على الحكم الصادر بتاريخ ${judgmentDate}${typeDescription}. يجب اتخاذ الإجراء قبل هذا التاريخ.`,
    days: daysToAdd
  };
};
