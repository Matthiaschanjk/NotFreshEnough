export type Severity = "low" | "medium" | "high";
export type Verdict = "Borderline" | "Jialat" | "Siao Liao";
export type PersonaSource = "llm" | "fallback";
export type StatusLabel = "PASS" | "FAIL";
export type ArtifactType =
  | "README intro"
  | "landing page hero section"
  | "30-second demo pitch"
  | "what judges should know section"
  | "project summary";

export interface JudgeProjectRequest {
  repoUrl: string;
  demoUrl?: string;
  submissionUrl?: string;
  projectBlurb?: string;
}

export interface AnalysisPoint {
  title: string;
  detail: string;
  severity: Severity;
  evidenceIds: string[];
}

export interface AnalysisEvidence {
  id: string;
  title: string;
  detail: string;
  signal: "positive" | "negative" | "neutral";
  sourceIds: string[];
  excerpt?: string;
}

export interface AnalysisSource {
  id: string;
  label: string;
  surfaceType: string;
  status: "ok" | "partial" | "failed" | "skipped";
  url?: string;
}

export interface SharedProjectAnalysis {
  projectName: string;
  summary: string;
  sourcesInspected: AnalysisSource[];
  strongPoints: AnalysisPoint[];
  weakPoints: AnalysisPoint[];
  missingElements: AnalysisPoint[];
  judgeConcerns: AnalysisPoint[];
  evidence: AnalysisEvidence[];
  scores: {
    clarity: number;
    completeness: number;
    differentiation: number;
    usability: number;
    technicalDepth: number;
    freshness: number;
    overall: number;
    overallGrade: string;
  };
  bestArtifactToRefurbish: {
    artifactType: ArtifactType;
    reason: string;
    sourceSnippet?: string;
  };
  freshnessNarrative: string;
}

export interface AuntyQuestions {
  questions: string[];
}

export interface AhGongVerdict {
  verdict: Verdict;
  explanation: string;
  closingLine: string;
}

export interface KorkorRecommendations {
  recommendations: Array<{
    priority: 1 | 2 | 3;
    issue: string;
    whyItMatters: string;
    concreteAction: string;
  }>;
}

export interface KorkorRefurbishedProject {
  artifactType: ArtifactType;
  reason: string;
  title: string;
  content: string;
}

export interface PersonaEnvelope<T> {
  status: "ok" | "error";
  source?: PersonaSource;
  data?: T;
  error?: {
    message: string;
  };
}

export interface JudgeProjectResponse {
  requestId: string;
  generatedAt: string;
  inputEcho: JudgeProjectRequest;
  analysis: SharedProjectAnalysis;
  tinyFish: {
    investigationMode: "mock" | "sdk";
    warnings: string[];
    sourcesInspected: number;
  };
  panel: {
    familyHeadline: string;
    statusLabel: StatusLabel;
    aunty: PersonaEnvelope<AuntyQuestions>;
    ahGong: PersonaEnvelope<AhGongVerdict>;
    korkorRecommendations: PersonaEnvelope<KorkorRecommendations>;
    korkorRefurbished: PersonaEnvelope<KorkorRefurbishedProject>;
  };
}
