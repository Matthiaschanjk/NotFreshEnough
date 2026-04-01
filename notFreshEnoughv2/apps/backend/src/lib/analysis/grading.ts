export const GRADE_SCALE = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"] as const;

export type FinalGrade = (typeof GRADE_SCALE)[number];

const GRADE_THRESHOLDS: Array<{ min: number; grade: FinalGrade }> = [
  { min: 9.5, grade: "A+" },
  { min: 9.0, grade: "A" },
  { min: 8.5, grade: "A-" },
  { min: 8.0, grade: "B+" },
  { min: 7.0, grade: "B" },
  { min: 6.5, grade: "B-" },
  { min: 6.0, grade: "C+" },
  { min: 5.0, grade: "C" },
  { min: 4.5, grade: "C-" },
  { min: 4.0, grade: "D+" },
  { min: 3.0, grade: "D" },
  { min: 2.0, grade: "D-" },
  { min: 0, grade: "F" }
];

export function gradeForOverallScore(overall: number): FinalGrade {
  return GRADE_THRESHOLDS.find((entry) => overall >= entry.min)?.grade ?? "F";
}

export function isPassingGrade(grade: FinalGrade) {
  return grade === "A+" || grade === "A" || grade === "A-";
}

