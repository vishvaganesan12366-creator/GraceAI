import type { AIAnalysisResult, ComplaintPriority, SLARisk } from '@/types';

interface CategoryConfig {
  category: string;
  department: string;
  keywords: string[];
  slaHours: number;
  basePriority: ComplaintPriority;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    category: 'Road Infrastructure',
    department: 'Municipal Engineering',
    keywords: ['pothole', 'road', 'street', 'bridge', 'potholes', 'crack', 'footpath', 'sidewalk', 'construction', 'infrastructure', 'damage', 'broken road', 'manhole'],
    slaHours: 48,
    basePriority: 'HIGH',
  },
  {
    category: 'Electricity',
    department: 'Electricity',
    keywords: ['street light', 'light', 'electricity', 'power', 'electric', 'transformer', 'wire', 'voltage', 'lamp', 'pole', 'outage', 'short circuit', 'streetlight'],
    slaHours: 24,
    basePriority: 'MEDIUM',
  },
  {
    category: 'Water Supply',
    department: 'Water Supply',
    keywords: ['water', 'leak', 'pipeline', 'leakage', 'supply', 'tap', 'drinking water', 'sewage', 'drainage', 'flood', 'overflow', 'pipe', 'tank'],
    slaHours: 24,
    basePriority: 'HIGH',
  },
  {
    category: 'Sanitation',
    department: 'Sanitation',
    keywords: ['garbage', 'waste', 'trash', 'sanitation', 'cleanliness', 'dustbin', 'rubbish', 'sewage', 'smell', 'odor', 'dump', 'sweeping', 'cleaning'],
    slaHours: 72,
    basePriority: 'MEDIUM',
  },
  {
    category: 'Healthcare',
    department: 'Public Health',
    keywords: ['mosquito', 'disease', 'health', 'hospital', 'dengue', 'malaria', 'fever', 'clinic', 'medical', 'infection', 'stagnant water', 'pest', 'rodent'],
    slaHours: 48,
    basePriority: 'HIGH',
  },
  {
    category: 'Public Safety',
    department: 'Police',
    keywords: ['theft', 'police', 'crime', 'safety', 'security', 'robbery', 'stealing', 'suspicious', 'harassment', 'attack', 'danger', 'patrol', 'thief'],
    slaHours: 12,
    basePriority: 'CRITICAL',
  },
  {
    category: 'Transport',
    department: 'Transport',
    keywords: ['traffic', 'signal', 'transport', 'bus', 'road safety', 'junction', 'congestion', 'accident', 'vehicle', 'parking', 'sign', 'speed breaker'],
    slaHours: 48,
    basePriority: 'MEDIUM',
  },
  {
    category: 'Education',
    department: 'Education',
    keywords: ['school', 'education', 'teacher', 'classroom', 'student', 'building', 'roof', 'college', 'infrastructure', 'library', 'facility'],
    slaHours: 120,
    basePriority: 'LOW',
  },
];

function countKeywordMatches(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  let count = 0;
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      count += 1;
    }
  }
  return count;
}

function calculateConfidence(matchCount: number, textLength: number): number {
  const base = Math.min(85 + matchCount * 3, 98);
  const lengthBonus = textLength > 50 ? 2 : 0;
  return Math.min(base + lengthBonus, 99);
}

function detectUrgency(text: string): number {
  const lowerText = text.toLowerCase();
  const urgencyWords = ['urgent', 'immediate', 'emergency', 'critical', 'danger', 'accident', 'severe', 'serious', 'multiple', 'several', 'frequent', 'days', 'week'];
  let urgency = 0;
  for (const word of urgencyWords) {
    if (lowerText.includes(word)) urgency += 1;
  }
  return urgency;
}

function adjustPriority(base: ComplaintPriority, urgency: number): ComplaintPriority {
  if (urgency >= 3) return 'CRITICAL';
  if (urgency >= 2) return base === 'LOW' ? 'MEDIUM' : base === 'MEDIUM' ? 'HIGH' : 'HIGH';
  if (urgency >= 1) return base === 'LOW' ? 'MEDIUM' : base;
  return base;
}

function calculateSLARisk(priority: ComplaintPriority, estimatedHours: number, slaHours: number): SLARisk {
  const ratio = estimatedHours / slaHours;
  if (ratio > 0.85 || priority === 'CRITICAL') return 'HIGH';
  if (ratio > 0.65 || priority === 'HIGH') return 'MEDIUM';
  return 'LOW';
}

function generateReason(category: string, text: string, urgency: number): string {
  const lowerText = text.toLowerCase();
  const reasons: Record<string, string[]> = {
    'Road Infrastructure': [
      'The complaint describes a road safety issue affecting public transportation and pedestrian safety.',
      'The complaint reports infrastructure damage that poses risk to commuters.',
    ],
    'Electricity': [
      'The complaint describes a street lighting or electrical failure affecting public safety.',
      'The complaint reports an electrical infrastructure issue requiring immediate attention.',
    ],
    'Water Supply': [
      'The complaint reports a water pipeline issue causing resource wastage and potential water shortage.',
      'The complaint describes a water supply disruption affecting residents.',
    ],
    'Sanitation': [
      'The complaint describes a sanitation issue with potential public health implications.',
      'The complaint reports waste management failure requiring cleanup.',
    ],
    'Healthcare': [
      'The complaint describes a public health hazard requiring immediate intervention.',
      'The complaint reports a disease risk factor in the community.',
    ],
    'Public Safety': [
      'The complaint reports criminal activity and requests immediate law enforcement attention.',
      'The complaint describes a public safety concern requiring police intervention.',
    ],
    'Transport': [
      'The complaint describes a traffic infrastructure issue causing public inconvenience and safety risks.',
      'The complaint reports a transportation system malfunction.',
    ],
    'Education': [
      'The complaint describes an educational infrastructure issue affecting student learning conditions.',
      'The complaint reports a facility problem at an educational institution.',
    ],
  };

  const categoryReasons = reasons[category] || ['The complaint has been analyzed and categorized.'];
  const reasonIndex = urgency > 1 ? 0 : Math.min(1, categoryReasons.length - 1);
  return categoryReasons[reasonIndex];
}

export function analyzeComplaintText(text: string): AIAnalysisResult {
  const matchScores = CATEGORY_CONFIGS.map(config => ({
    config,
    score: countKeywordMatches(text, config.keywords),
  }));

  matchScores.sort((a, b) => b.score - a.score);

  const bestMatch = matchScores[0];
  const fallback = matchScores.find(m => m.score > 0) || bestMatch;
  const selected = fallback.score > 0 ? fallback : bestMatch;

  const urgency = detectUrgency(text);
  const priority = adjustPriority(selected.config.basePriority, urgency);
  const confidence = calculateConfidence(selected.score, text.length);
  const duplicateProbability = Math.round(Math.random() * 25);
  const slaHours = priority === 'CRITICAL' ? Math.min(selected.config.slaHours, 12) : selected.config.slaHours;
  const estimatedResolutionHours = Math.max(slaHours - Math.round(Math.random() * 6), Math.round(slaHours * 0.6));
  const slaRisk = calculateSLARisk(priority, estimatedResolutionHours, slaHours);
  const reason = generateReason(selected.config.category, text, urgency);

  return {
    category: selected.config.category,
    department: selected.config.department,
    departmentId: null,
    priority,
    confidence,
    duplicateProbability,
    estimatedResolutionHours,
    slaHours,
    slaRisk,
    reason,
  };
}

export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  if (words1.size === 0 || words2.size === 0) return 0;

  let common = 0;
  for (const word of words1) {
    if (words2.has(word)) common++;
  }

  const union = words1.size + words2.size - common;
  return Math.round((common / union) * 100);
}
