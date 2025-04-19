import {
  getQuizResponses,
  submitQuizResponse,
} from "@/client/services/quizService";
import {
  createSubmission,
  getMySubmissions,
  updateSubmission,
} from "@/client/services/submissionService";
import { CourseItem } from "@/shared/types/models/courseItem";
import { Enrollment } from "@/shared/types/models/enrollment";
import {
  QuizQuestionWithOptions,
  QuizResponse,
} from "@/shared/types/models/quiz";
import { useEffect, useState } from "react";

/**
 * Student response interface for professor view.
 */
export interface StudentResponse {
  /**
   * The ID of the student.
   * @type {number}
   */
  studentId: number;

  /**
   * The name of the student.
   * @type {string}
   */
  studentName: string;

  /**
   * The ID of the quiz submission.
   * @type {number}
   */
  submissionId: number;

  /**
   * Whether the quiz is completed.
   * @type {boolean}
   */
  completed: boolean;

  /**
   * Student responses mapped by question ID.
   * @type {Record<number, string>}
   */
  responses: Record<number, string>;

  /**
   * The score of the submission.
   * @type {number | undefined}
   */
  score?: number;
}

/**
 * Custom hook to manage quiz submissions and responses.
 * @param {CourseItem} courseItem - The quiz course item.
 * @param {Enrollment | undefined} enrollment - The student's enrollment.
 * @param {QuizQuestionWithOptions[]} questions - The quiz questions.
 * @param {function | undefined} onSubmit - Callback when quiz is submitted.
 */
export const useQuizSubmission = (
  courseItem: CourseItem,
  enrollment?: Enrollment,
  questions: QuizQuestionWithOptions[] = [],
  onSubmit?: () => void
) => {
  const [studentResponses, setStudentResponses] = useState<
    Record<number, string>
  >({});

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [studentSubmissions, setStudentSubmissions] = useState<
    StudentResponse[]
  >([]);

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [viewingStudentResponses, setViewingStudentResponses] = useState(false);
  const [viewingStudentData, setViewingStudentData] =
    useState<StudentResponse | null>(null);

  const [isLoadingStudentData, setIsLoadingStudentData] = useState(false);
  const [isRefreshingSubmissions, setIsRefreshingSubmissions] = useState(false);

  useEffect(() => {
    if (enrollment) {
      initializeStudentView();
    }
  }, [courseItem.id, enrollment]);

  /**
   * Initialize the student view by checking for existing submissions.
   */
  const initializeStudentView = async () => {
    if (!enrollment) return;

    try {
      await checkExistingSubmission();
    } catch (error) {
      console.error(`Error initializing student view: ${error}`);
    }
  };

  /**
   * Check if there is an existing submission for the student.
   * If not, create a new submission.
   */
  const checkExistingSubmission = async () => {
    if (!enrollment) return;

    try {
      const existingSubmissions = await getMySubmissions(courseItem.course_id);

      if (existingSubmissions.success && existingSubmissions.data) {
        const submissions = Array.isArray(existingSubmissions.data)
          ? existingSubmissions.data
          : [existingSubmissions.data];

        // Find a submission for this course item.
        const existingSubmission = submissions.find(
          (sub) => sub.item_id === courseItem.id
        );

        if (existingSubmission) {
          // Use the existing submission.
          setSubmissionId(existingSubmission.id);

          // If submission is already submitted, load responses and mark as completed.
          if (existingSubmission.status === "submitted") {
            setIsCompleted(true);
            await loadExistingResponses(existingSubmission.id);
          }

          return;
        }
      }

      // If no existing submission was found, create a new one.
      const submissionData = {
        enrollment_id: enrollment.id,
        item_id: courseItem.id,
        status: "draft" as "draft",
      };

      const response = await createSubmission(submissionData);
      if (response.success && response.data) {
        const submission = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        setSubmissionId(submission.id);
      }
    } catch (error) {
      console.error(`Error checking existing submission: ${error}`);
    }
  };

  /**
   * Load existing responses for a submission.
   * @param {number} submissionId - The submission ID.
   */
  const loadExistingResponses = async (submissionId: number) => {
    try {
      const responseData = await getQuizResponses(submissionId);

      if (
        responseData.success &&
        responseData.data &&
        responseData.data.responses
      ) {
        const responses = responseData.data.responses;
        const responseMap: Record<number, string> = {};

        responses.forEach((response: QuizResponse) => {
          responseMap[response.question_id] = response.response;
        });

        setStudentResponses(responseMap);
      }
    } catch (error) {
      console.error(`Error loading existing responses: ${error}`);
      throw error;
    }
  };

  /**
   * Handle response change for a question.
   * @param {number} questionId - The question ID.
   * @param {string} response - The student's response.
   */
  const handleResponseChange = async (questionId: number, response: string) => {
    if (!submissionId && enrollment) {
      await checkExistingSubmission();
    }

    // Update the response in local state.
    setStudentResponses((prev) => ({
      ...prev,
      [questionId]: response,
    }));
  };

  /**
   * Submit a response to a quiz question.
   */
  const handleSubmitResponse = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion || !studentResponses[currentQuestion.id]) return;

    if (!submissionId && enrollment) {
      await checkExistingSubmission();
    }

    if (submissionId) {
      try {
        await submitQuizResponse({
          submission_id: submissionId,
          question_id: currentQuestion.id,
          response: studentResponses[currentQuestion.id],
        });
      } catch (error) {
        console.error(`Error submitting response: ${error}`);
      }
    }

    // Move to the next question.
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  /**
   * Submit all responses and finish the quiz.
   */
  const handleFinishQuiz = async () => {
    if (!submissionId && enrollment) {
      await checkExistingSubmission();
      if (!submissionId) {
        console.error("Failed to get or create submission");
        return;
      }
    }

    if (!submissionId) return;
    setIsSubmitting(true);

    try {
      for (const question of questions) {
        if (studentResponses[question.id]) {
          await submitQuizResponse({
            submission_id: submissionId,
            question_id: question.id,
            response: studentResponses[question.id],
          });
        }
      }

      // Update the submission status to "submitted".
      const response = await updateSubmission(submissionId, {
        status: "submitted",
      });

      if (response.success) {
        setIsCompleted(true);
        if (onSubmit) onSubmit();
      }
    } catch (error) {
      console.error(`Error finishing quiz: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Exit student view (for professors).
   */
  const handleExitStudentView = () => {
    setViewingStudentResponses(false);
    setViewingStudentData(null);
    setCurrentQuestionIndex(0);
  };

  return {
    studentResponses,
    setStudentResponses,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    submissionId,
    isSubmitting,
    isCompleted,
    studentSubmissions,
    setStudentSubmissions,
    selectedStudent,
    setSelectedStudent,
    viewingStudentResponses,
    setViewingStudentResponses,
    viewingStudentData,
    setViewingStudentData,
    isLoadingStudentData,
    setIsLoadingStudentData,
    isRefreshingSubmissions,
    setIsRefreshingSubmissions,
    handleResponseChange,
    handleSubmitResponse,
    handleFinishQuiz,
    handleExitStudentView,
    loadExistingResponses,
  };
};
