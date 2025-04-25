import { useAuth } from "@/client/context/auth";
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
import { useCallback, useState } from "react";

/**
 * Custom hook for managing grades functionality.
 * Provides methods to grade submissions, fetch grades, and finalize course grades.
 */
export function useGrades() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [courseGrades, setCourseGrades] = useState<{
    grades: GradeWithItemDetails[];
    ungradedItems: CourseItem[];
    finalGrade: string | null;
  }>({
    grades: [],
    ungradedItems: [],
    finalGrade: null,
  });

  const [studentData, setStudentData] = useState<{
    student: User | null;
    grades: GradeWithItemDetails[];
  }>({
    student: null,
    grades: [],
  });

  /**
   * Grade a student's submission.
   * @param gradeData The grade data to submit.
   */
  const submitGrade = useCallback(
    async (gradeData: GradeInput): Promise<Grade | null> => {
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
          error instanceof Error ? error.message : "Grading error";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Fetch grades for a specific student in a course.
   * @param courseId The course ID.
   * @param studentId The student ID.
   */
  const fetchStudentGrades = useCallback(
    async (courseId: number, studentId: number): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await getStudentGradesForCourse(courseId, studentId);
        if (response.success && response.data) {
          const data = response.data as {
            student: User;
            grades: GradeWithItemDetails[];
          };

          setStudentData(data);
        } else {
          setError(response.message || "Failed to fetch student grades");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error fetching grades";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Fetch all grades for a specific course item.
   * @param itemId The course item ID.
   */
  const fetchItemGrades = useCallback(
    async (itemId: number): Promise<GradeWithItemDetails[] | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await getGradesByItemId(itemId);
        if (response.success && response.data) {
          const grades = response.data as GradeWithItemDetails[];
          return grades;
        } else {
          setError(response.message || "Failed to fetch grades for this item");
          return null;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error fetching item grades";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Fetch the current student's grades for a course.
   * @param courseId The course ID.
   */
  const fetchMyGrades = useCallback(
    async (courseId: number): Promise<void> => {
      if (!user) return;

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

          setCourseGrades({
            grades: data.grades,
            ungradedItems: data.ungraded_items,
            finalGrade: data.final_grade,
          });
        } else {
          setError(response.message || "Failed to fetch your grades");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error fetching grades";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  /**
   * Finalize grades for all students in a course.
   * @param courseId The course ID.
   */
  const finalizeGrades = useCallback(
    async (courseId: number): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await finalizeGradesForCourse(courseId);
        if (!response.success) {
          setError(response.message || "Failed to finalize grades");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error finalizing grades";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Calculate percentage grade from a set of grades.
   * @param grades List of grades with max points.
   */
  const calculatePercentage = useCallback(
    (grades: GradeWithItemDetails[]): number => {
      if (!grades || grades.length === 0) return 0;

      let totalPoints = 0;
      let earnedPoints = 0;

      grades.forEach((grade) => {
        totalPoints += grade.max_points;
        earnedPoints += grade.points_earned;
      });

      return totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    },
    []
  );

  /**
   * Convert percentage to letter grade.
   * @param percentage Percentage score (0-100).
   */
  const getLetterGrade = useCallback((percentage: number): string => {
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
  }, []);

  return {
    loading,
    error,
    courseGrades,
    studentData,

    submitGrade,
    fetchStudentGrades,
    fetchItemGrades,
    fetchMyGrades,
    finalizeGrades,
    calculatePercentage,
    getLetterGrade,
  };
}
