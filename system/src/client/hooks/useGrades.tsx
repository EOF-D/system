import {
  finalizeGradesForCourse,
  getGradesByItemId,
  getMyGradesForCourse,
  getStudentGradesForCourse,
  gradeSubmission,
} from "@/client/services/gradeService";
import { CourseItem } from "@/shared/types/models/courseItem";
import {
  Grade,
  GradeInput,
  GradeWithItemDetails,
} from "@/shared/types/models/grade";
import { User } from "@/shared/types/models/user";
import { useState } from "react";

/**
 * Custom hook for managing grades functionality.
 * Provides methods to grade submissions, fetch grades, and finalize course grades.
 */
export function useGrades() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [studentGrades, setStudentGrades] = useState<GradeWithItemDetails[]>(
    []
  );

  const [itemGrades, setItemGrades] = useState<GradeWithItemDetails[]>([]);
  const [myGrades, setMyGrades] = useState<{
    grades: GradeWithItemDetails[];
    ungraded_items: CourseItem[];
    final_grade: string | null;
  }>({
    grades: [],
    ungraded_items: [],
    final_grade: null,
  });

  const [studentData, setStudentData] = useState<{
    student: User | null;
    grades: GradeWithItemDetails[];
  }>({
    student: null,
    grades: [],
  });

  const [finalizedGrades, setFinalizedGrades] = useState<
    { student_id: number; final_grade: string }[]
  >([]);

  /**
   * Grade a student's submission.
   * @param gradeData The grade data to submit.
   * @returns A promise that resolves when the grade is submitted.
   */
  const submitGrade = async (gradeData: GradeInput): Promise<Grade | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await gradeSubmission(gradeData);

      if (response.success && response.data) {
        return response.data as Grade;
      } else {
        setError(response.message || "Failed to submit grade");
        return null;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while submitting the grade";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get all grades for a specific student in a course.
   * @param courseId The ID of the course.
   * @param studentId The ID of the student.
   */
  const fetchStudentGradesForCourse = async (
    courseId: number,
    studentId: number
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await getStudentGradesForCourse(courseId, studentId);

      if (response.success && response.data) {
        const data = response.data as {
          student: User;
          grades: GradeWithItemDetails[];
        };

        setStudentGrades(data.grades);
        setStudentData(data);
      } else {
        setError(response.message || "Failed to fetch student grades");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while fetching student grades";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get all grades for a specific course item.
   * @param itemId The ID of the course item.
   */
  const fetchGradesByItemId = async (itemId: number): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await getGradesByItemId(itemId);

      if (response.success && response.data) {
        setItemGrades(response.data as GradeWithItemDetails[]);
      } else {
        setError(response.message || "Failed to fetch grades for this item");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while fetching item grades";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get the current student's grades for a course.
   * @param courseId The ID of the course.
   */
  const fetchMyGradesForCourse = async (courseId: number): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await getMyGradesForCourse(courseId);

      if (response.success && response.data) {
        const data = response.data as {
          grades: GradeWithItemDetails[];
          ungraded_items: CourseItem[];
          final_grade: string | null;
        };

        setMyGrades(data);
      } else {
        setError(response.message || "Failed to fetch your grades");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while fetching your grades";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate and finalize grades for all students in a course.
   * @param courseId The ID of the course.
   */
  const finalizeGrades = async (courseId: number): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await finalizeGradesForCourse(courseId);
      if (response.success && response.data) {
        setFinalizedGrades(
          response.data as { student_id: number; final_grade: string }[]
        );
      } else {
        setError(response.message || "Failed to finalize grades");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while finalizing grades";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate the percentage grade for a student.
   * @param grades The student's grades.
   * @returns The percentage grade (0-100).
   */
  const calculatePercentage = (grades: GradeWithItemDetails[]): number => {
    if (!grades || grades.length === 0) return 0;

    let totalPoints = 0;
    let earnedPoints = 0;

    grades.forEach((grade) => {
      totalPoints += grade.max_points;
      earnedPoints += grade.points_earned;
    });

    return totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  };

  /**
   * Get a letter grade based on a percentage.
   * @param percentage The percentage grade (0-100).
   * @returns The letter grade (A, B, C, etc.).
   */
  const getLetterGrade = (percentage: number): string => {
    if (percentage >= 93) return "A";
    if (percentage >= 90) return "A-";
    if (percentage >= 87) return "B+";
    if (percentage >= 83) return "B";
    if (percentage >= 80) return "B-";
    if (percentage >= 77) return "C+";
    if (percentage >= 73) return "C";
    if (percentage >= 70) return "C-";
    if (percentage >= 67) return "D+";
    if (percentage >= 63) return "D";
    if (percentage >= 60) return "D-";
    return "F";
  };

  /**
   * Reset all state data.
   */
  const resetState = () => {
    setStudentGrades([]);
    setItemGrades([]);
    setMyGrades({
      grades: [],
      ungraded_items: [],
      final_grade: null,
    });
    setStudentData({
      student: null,
      grades: [],
    });
    setFinalizedGrades([]);
    setError(null);
  };

  return {
    loading,
    error,
    studentGrades,
    itemGrades,
    myGrades,
    studentData,
    finalizedGrades,

    submitGrade,
    fetchStudentGradesForCourse,
    fetchGradesByItemId,
    fetchMyGradesForCourse,
    finalizeGrades,

    calculatePercentage,
    getLetterGrade,
    resetState,
  };
}
