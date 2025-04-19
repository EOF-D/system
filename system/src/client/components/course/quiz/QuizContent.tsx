import { QuizCompletionStatus } from "@/client/components/course/quiz/QuizCompletionStatus";
import { QuizProfessorTools } from "@/client/components/course/quiz/QuizProfessorTools";
import { QuizProgressBar } from "@/client/components/course/quiz/QuizProgressBar";
import { QuizQuestion } from "@/client/components/course/quiz/QuizQuestion";
import { QuizQuestionEditor } from "@/client/components/course/quiz/QuizQuestionEditor";
import { QuizStudentResponsesModal } from "@/client/components/course/quiz/QuizStudentResponsesModal";
import { useQuizQuestions } from "@/client/hooks/useQuizQuestions";
import {
  StudentResponse,
  useQuizSubmission,
} from "@/client/hooks/useQuizSubmission";
import { isProfessor } from "@/client/services/authService";
import { getCourseEnrollments } from "@/client/services/enrollmentService";
import {
  calculateQuizScore,
  getQuizResponses,
} from "@/client/services/quizService";
import { getSubmissionsByItemId } from "@/client/services/submissionService";
import { CourseItem } from "@/shared/types/models/courseItem";
import { Enrollment } from "@/shared/types/models/enrollment";
import { Button, Spinner, useDisclosure } from "@heroui/react";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconUserCheck,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * QuizContent props interface.
 */
interface QuizContentProps {
  /**
   * The course item object containing quiz details.
   * @type {CourseItem}
   */
  courseItem: CourseItem;

  /**
   * The enrollment object containing enrollment details.
   * @type {Enrollment | undefined}
   */
  enrollment?: Enrollment;

  /**
   * Callback function to be called when the quiz is submitted.
   * @type {function}
   */
  onSubmit?: () => void;

  /**
   * Callback function to be called when the quiz is refreshed.
   * @type {function}
   */
  onRefresh?: () => void;
}

/**
 * QuizContent component to display and manage quiz content.
 * @param {QuizContentProps} props - The props for the QuizContent component.
 * @returns {JSX.Element} The QuizContent component.
 */
export const QuizContent = ({
  courseItem,
  enrollment,
  onSubmit,
  onRefresh,
}: QuizContentProps): JSX.Element => {
  const [isInProfessorMode] = useState(isProfessor());
  const [isViewingStudentSubmission, setIsViewingStudentSubmission] =
    useState(false);

  const [_, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addQuestionDisclosure = useDisclosure();
  const studentResponsesDisclosure = useDisclosure();

  // Use hooks to manage quiz questions and submissions.
  const {
    questions,
    isLoading: isQuestionsLoading,
    error: questionsError,
    fetchQuizQuestions,
  } = useQuizQuestions(courseItem.id);

  const {
    studentResponses,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    isSubmitting,
    isCompleted,
    studentSubmissions,
    setStudentSubmissions,
    viewingStudentData,
    setViewingStudentData,
    setIsLoadingStudentData,
    setIsRefreshingSubmissions,
    handleResponseChange,
    handleSubmitResponse,
    handleFinishQuiz,
  } = useQuizSubmission(courseItem, enrollment, questions, onSubmit);

  // Initialize the component.
  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        if (isInProfessorMode) {
          await fetchStudentSubmissions();
        }
        setIsInitialized(true);
      } catch (error) {
        console.error(`Error initializing quiz: ${error}`);
        setError("Failed to initialize quiz. Please try again.");
      }
    };

    if (!isQuestionsLoading && !questionsError) {
      initializeQuiz();
    }
  }, [isQuestionsLoading, questionsError, isInProfessorMode]);

  // Fetch student submissions for professor view.
  const fetchStudentSubmissions = async () => {
    setIsRefreshingSubmissions(true);

    try {
      const response = await getSubmissionsByItemId(courseItem.id);

      if (response.success && response.data) {
        const submissions = Array.isArray(response.data)
          ? response.data
          : [response.data];

        const studentResponsesData: StudentResponse[] = await Promise.all(
          submissions.map(async (submission: any) => {
            let studentId = 0;
            let responses: Record<number, string> = {};

            // Try to get student ID from enrollments.
            try {
              const enrollmentResponse = await getCourseEnrollments(
                courseItem.course_id
              );
              if (
                enrollmentResponse.success &&
                Array.isArray(enrollmentResponse.data)
              ) {
                const enrollment = enrollmentResponse.data.find(
                  (e) => e.id === submission.enrollment_id
                );

                if (enrollment) {
                  studentId = enrollment.student_id;
                }
              }
            } catch (error) {
              console.error(`Error getting enrollment data: ${error}`);
            }

            // Get the quiz responses if submission is completed.
            if (submission.status === "submitted") {
              try {
                const quizResponseData = await getQuizResponses(submission.id);

                if (
                  quizResponseData.success &&
                  quizResponseData.data &&
                  quizResponseData.data.responses
                ) {
                  const responseList = quizResponseData.data.responses;
                  responseList.forEach((response: any) => {
                    responses[response.question_id] = response.response;
                  });
                }
              } catch (error) {
                console.error(
                  `Error loading responses for submission ${submission.id}: ${error}`
                );
              }
            }

            // Calculate score if available.
            let score = 0;
            if (
              submission.points_earned !== undefined &&
              submission.points_earned !== null &&
              courseItem.max_points > 0
            ) {
              score = Math.round(
                (submission.points_earned / courseItem.max_points) * 100
              );
            }

            return {
              studentId,
              studentName: submission.student_full_name || "Unknown Student",
              submissionId: submission.id,
              completed: submission.status === "submitted",
              responses,
              score: score || undefined,
            };
          })
        );

        setStudentSubmissions(
          studentResponsesData.filter((sr) => sr !== undefined)
        );
      }
    } catch (error) {
      console.error(`Error fetching student submissions: ${error}`);
      setError("Failed to load student submissions. Please try again.");
    } finally {
      setIsRefreshingSubmissions(false);
    }
  };

  const loadStudentSubmission = async (studentId: string) => {
    if (!studentId) return;

    setIsLoadingStudentData(true);

    try {
      const student = studentSubmissions.find(
        (s) => s.studentId.toString() === studentId
      );

      if (student) {
        // Check if responses need to be loaded.
        if (Object.keys(student.responses).length === 0 && student.completed) {
          try {
            console.log(
              `Loading responses for submission ${student.submissionId}`
            );
            const responseData = await getQuizResponses(student.submissionId);

            if (
              responseData.success &&
              responseData.data &&
              responseData.data.responses
            ) {
              const responseList = responseData.data.responses;
              const responses: Record<number, string> = {};

              responseList.forEach((response: any) => {
                responses[response.question_id] = response.response;
              });

              // Update the student's responses.
              student.responses = responses;
            }
          } catch (error) {
            console.error(
              `Error loading responses for student ${studentId}:`,
              error
            );
          }
        }

        setViewingStudentData({ ...student }); // Create a new object to trigger re-render.
        setIsViewingStudentSubmission(true);
        setCurrentQuestionIndex(0);
      } else {
        console.error(`Student ${studentId} not found in submissions`);
      }
    } catch (error) {
      console.error(`Error loading student submission: ${error}`);
      setError("Failed to load student responses. Please try again.");
    } finally {
      setIsLoadingStudentData(false);
    }
  };

  const handleCalculateScore = async (submissionId: number) => {
    try {
      setIsLoadingStudentData(true);

      const response = await calculateQuizScore(submissionId);

      if (response.success) {
        // Refresh student submissions to get updated scores.
        await fetchStudentSubmissions();
      }
    } catch (error) {
      console.error(`Error calculating score: ${error}`);
      setError("Failed to calculate score. Please try again.");
    } finally {
      setIsLoadingStudentData(false);
    }
  };

  const handleAddQuestion = async () => {
    if (onRefresh) {
      onRefresh();
    }
    await fetchQuizQuestions();
  };

  const renderContent = () => {
    if (isQuestionsLoading) {
      return (
        <div className="flex justify-center items-center p-12">
          <Spinner size="lg" color="primary" />
        </div>
      );
    }

    if (questionsError || error) {
      return (
        <div className="p-6 text-center">
          <p className="text-danger mb-4">{questionsError || error}</p>
          <Button
            color="primary"
            variant="flat"
            onPress={() => window.location.reload()}
          >
            Reload
          </Button>
        </div>
      );
    }

    if (questions.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center p-12 text-center"
          style={{ paddingTop: "40px", paddingBottom: "40px" }}
        >
          <p className="text-default-600 mb-5">
            {isInProfessorMode
              ? "No questions have been added to this quiz yet."
              : "This quiz does not have any questions yet."}
          </p>
          {isInProfessorMode && (
            <Button
              color="primary"
              startContent={<IconPlus size={18} />}
              onPress={addQuestionDisclosure.onOpen}
            >
              Add Question
            </Button>
          )}
        </div>
      );
    }

    if (!isInProfessorMode && isCompleted) {
      return (
        <QuizCompletionStatus
          answeredQuestions={Object.keys(studentResponses).length}
          totalQuestions={questions.length}
        />
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isViewingStudent = isInProfessorMode && isViewingStudentSubmission;

    // When viewing a student submission, get their responses.
    const responses =
      isViewingStudent && viewingStudentData
        ? viewingStudentData.responses
        : studentResponses;

    return (
      <div className="flex flex-col w-full">
        <QuizProgressBar
          currentIndex={currentQuestionIndex}
          totalQuestions={questions.length}
        />

        <div className="flex flex-col space-y-4" style={{ padding: "20px" }}>
          <QuizQuestion
            question={currentQuestion}
            response={responses[currentQuestion.id] || ""}
            onResponseChange={handleResponseChange}
            isReadOnly={isInProfessorMode || isSubmitting || isCompleted}
            isViewingStudent={isViewingStudent}
            isProfessorMode={isInProfessorMode}
          />

          <div
            className="flex justify-between items-center"
            style={{ paddingTop: "20px" }}
          >
            <Button
              color="default"
              variant="flat"
              disabled={currentQuestionIndex === 0}
              onPress={() =>
                setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
              }
              startContent={<IconChevronLeft size={18} />}
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {isInProfessorMode && !isViewingStudentSubmission && (
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<IconPlus size={18} />}
                  onPress={addQuestionDisclosure.onOpen}
                >
                  Add Question
                </Button>
              )}

              {isInProfessorMode && !isViewingStudentSubmission && (
                <Button
                  color="secondary"
                  variant="flat"
                  startContent={<IconUserCheck size={18} />}
                  onPress={studentResponsesDisclosure.onOpen}
                >
                  View Responses
                </Button>
              )}

              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  color="primary"
                  disabled={
                    (!isInProfessorMode && !responses[currentQuestion.id]) ||
                    isSubmitting ||
                    isCompleted
                  }
                  onPress={
                    isInProfessorMode
                      ? () => setCurrentQuestionIndex((prev) => prev + 1)
                      : handleSubmitResponse
                  }
                  endContent={<IconChevronRight size={18} />}
                  isLoading={isSubmitting}
                >
                  Next
                </Button>
              ) : (
                !isInProfessorMode && (
                  <Button
                    color="success"
                    disabled={isCompleted}
                    onPress={handleFinishQuiz}
                    isLoading={isSubmitting}
                    endContent={<IconCheck size={18} />}
                  >
                    Finish Quiz
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full">
      {isInProfessorMode && (
        <QuizProfessorTools
          isViewingStudentSubmission={isViewingStudentSubmission}
          viewingStudentData={viewingStudentData}
          onExitStudentView={() => {
            setIsViewingStudentSubmission(false);
            setViewingStudentData(null);
            studentResponsesDisclosure.onOpen(); // Reopen the student responses modal after exiting view.
          }}
        />
      )}

      {renderContent()}

      <QuizQuestionEditor
        isOpen={addQuestionDisclosure.isOpen}
        onClose={addQuestionDisclosure.onClose}
        courseItemId={courseItem.id}
        onQuestionAdded={handleAddQuestion}
      />

      <QuizStudentResponsesModal
        isOpen={studentResponsesDisclosure.isOpen}
        onClose={studentResponsesDisclosure.onClose}
        studentSubmissions={studentSubmissions}
        onViewSubmission={loadStudentSubmission}
      />
    </div>
  );
};
