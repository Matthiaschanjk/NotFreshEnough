export interface SimilarProjectInputRepo {
  full_name: string;
  url: string;
  languages: string[];
  topics: string[];
  description: string;
  stars: number;
}

export interface SimilarProjectResult {
  full_name?: string;
  url: string;
  source: "github" | "devpost" | "linkedin";
  one_line_description: string;
  similarity_score: number;
  primary_language: string;
  stars?: number;
  topic_overlap: string[];
  demo_url_present: boolean;
  docs_quality: "low" | "med" | "high";
}

export interface SimilarProjectsResponse {
  input_repo: SimilarProjectInputRepo;
  results: SimilarProjectResult[];
  project_status: "original_project" | "cousins_found" | "error";
  message?: string;
}
