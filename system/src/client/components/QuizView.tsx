import { isProfessor } from "@/client/services/authService";
import { getMyEnrollments } from "@/client/services/enrollmentService";
import {
  calculateQuizScore,
  getQuizQuestions,
  getQuizResponses,
  submitQuizResponse,
} from "@/client/services/quizService";
import {
  createSubmission,
  getSubmissionById,
} from "@/client/services/submissionService";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Progress,
  Radio,
  RadioGroup,
  Spinner,
  Textarea,
} from "@heroui/react";
import { EnrollmentWithCourseDetails } from "@shared/types/models/enrollment";
import {
  QuizQuestionWithOptions,
  QuizResponse,
} from "@shared/types/models/quiz";
import { Submission } from "@shared/types/models/submission";
import { IconAlertCircle, IconCircleCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * QuizView props interface.
 */
interface QuizViewProps {
  /**
   * The ID of the course.
   * @type {number}
   */
  courseId: number;

  /**
   * The ID of the quiz item.
   * @type {number}
   */
  itemId: number;

  /**
   * The due date of the quiz.
   * @type {string}
   */
  dueDate: string;

  /**
   * The maximum points for the quiz.
   * @type {number}
   */
  maxPoints: number;

  /**
   * Callback function to be called on successful submission.
   * @type {() => void}
   */
  onSubmitSuccess?: () => void;
}

/**
 * QuizView component to display and manage quiz interactions.
 * @param {QuizViewProps} props - The props for the QuizView component.
 * @returns {JSX.Element} The QuizView component.
 */
export const QuizView = ({
  courseId,
  itemId,
  dueDate,
  maxPoints,
  onSubmitSuccess,
}: QuizViewProps): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestionWithOptions[]>([]);
  const [responses, setResponses] = useState<{ [key: number]: string }>({});
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [quizResponses, setQuizResponses] = useState<QuizResponse[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const isSubmitted =
    submission?.status === "submitted" || submission?.status === "graded";

  const isGraded = submission?.status === "graded";
  const isPastDue = new Date(dueDate) < new Date();
  const isProfessorView = isProfessor();

  useEffect(() => {
    fetchQuizData();
  }, [courseId, itemId]);

  const fetchQuizData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch quiz questions.
      const questionsResponse = await getQuizQuestions(itemId);
      if (questionsResponse.success && questionsResponse.data) {
        setQuestions(questionsResponse.data as QuizQuestionWithOptions[]);
      } else {
        setError("Failed to load quiz questions");
        return;
      }

      // Check if student has an existing submission.
      if (!isProfessorView) {
        const submissionResponse = await getSubmissionById(itemId);
        if (submissionResponse.success && submissionResponse.data) {
          const submissionData = submissionResponse.data as Submission;
          setSubmission(submissionData);

          // If submission exists, fetch responses.
          if (submissionData.id) {
            const responsesResponse = await getQuizResponses(submissionData.id);
            if (responsesResponse.success && responsesResponse.data) {
              const responseData = responsesResponse.data as {
                responses: QuizResponse[];
                questions: QuizQuestionWithOptions[];
              };

              setQuizResponses(responseData.responses);

              // Populate responses state.
              const responseMap: { [key: number]: string } = {};
              responseData.responses.forEach((resp) => {
                responseMap[resp.question_id] = resp.response;
              });

              setResponses(responseMap);

              // Check if quiz is graded.
              if (
                submissionData.status === "graded" &&
                responseData.responses.length > 0
              ) {
                // Calculate score based on correct responses.
                let calculatedScore = 0;
                responseData.responses.forEach((resp) => {
                  if (resp.is_correct) {
                    const question = responseData.questions.find(
                      (q) => q.id === resp.question_id
                    );

                    if (question) calculatedScore += question.points;
                  }
                });

                setScore(calculatedScore);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching quiz data: ${error}`);
      setError("An error occurred while loading the quiz");
    } finally {
      setLoading(false);
    }
  };

  // Handle response change for the current question.
  const handleResponseChange = (questionId: number, value: string) => {
    setResponses({
      ...responses,
      [questionId]: value,
    });
  };

  const handleSubmitResponse = async (questionId: number) => {
    if (!submission || !responses[questionId]) return;

    setSubmitting(true);

    try {
      const response = await submitQuizResponse({
        submission_id: submission.id,
        question_id: questionId,
        response: responses[questionId],
      });

      if (response.success) {
        // Move to next question if available.
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
        }
      } else {
        setError("Failed to submit response");
      }
    } catch (error) {
      console.error(`Error submitting response: ${error}`);
      setError("An error occurred while submitting your response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartQuiz = async () => {
    setSubmitting(true);

    try {
      // First we need to get the current user's enrollment ID for this course.
      const enrollmentsResponse = await getMyEnrollments("active");

      if (!enrollmentsResponse.success || !enrollmentsResponse.data) {
        setError("Failed to retrieve your enrollment information");
        setSubmitting(false);
        return;
      }

      // Find the enrollment for this specific course.
      const enrollments =
        enrollmentsResponse.data as EnrollmentWithCourseDetails[];

      const courseEnrollment = enrollments.find(
        (e) => e.course_id === courseId
      );

      if (!courseEnrollment) {
        setError("You are not enrolled in this course");
        setSubmitting(false);
        return;
      }

      // Create a submission for this quiz.
      const submissionResponse = await createSubmission({
        enrollment_id: courseEnrollment.id,
        item_id: itemId,
        status: "draft",
      });

      if (submissionResponse.success && submissionResponse.data) {
        setSubmission(submissionResponse.data as Submission);
      } else {
        setError("Failed to start quiz");
      }
    } catch (error) {
      console.error(`Error starting quiz: ${error}`);
      setError("An error occurred while starting the quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!submission) return;

    // Confirm submission.
    if (
      !confirm(
        "Are you sure you want to submit this quiz? You won't be able to change your answers after submission."
      )
    ) {
      return;
    }

    setSubmitting(true);

    try {
      // Update submission status to submitted.
      const response = await submitQuizResponse({
        submission_id: submission.id,
        question_id: questions[currentQuestion].id,
        response: responses[questions[currentQuestion].id] || "",
      });

      if (response.success) {
        // Refresh quiz data.
        await fetchQuizData();
        if (onSubmitSuccess) onSubmitSuccess();
      } else {
        setError("Failed to submit quiz");
      }
    } catch (error) {
      console.error(`Error submitting quiz: ${error}`);
      setError("An error occurred while submitting your quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGradeQuiz = async (submissionId: number) => {
    setSubmitting(true);

    try {
      const response = await calculateQuizScore(submissionId);

      if (response.success && response.data) {
        setScore(response.data.score);
        await fetchQuizData();
      } else {
        setError("Failed to grade quiz");
      }
    } catch (error) {
      console.error(`Error grading quiz: ${error}`);
      setError("An error occurred while grading the quiz");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mb-4 border border-danger-200">
        <CardBody>
          <div className="flex items-center gap-2 text-danger">
            <IconAlertCircle size={20} />
            <p>{error}</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Quiz not started yet.
  if (!submission && !isProfessorView) {
    return (
      <Card className="mb-4">
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Quiz</h2>
          <Chip color="primary">{maxPoints} points</Chip>
        </CardHeader>
        <CardBody className="text-center">
          <p className="mb-4">
            This quiz contains {questions.length} questions.
          </p>
          <p className="mb-4">Due date: {new Date(dueDate).toLocaleString()}</p>
          {isPastDue ? (
            <div className="bg-danger-100 p-4 rounded-lg mb-4">
              <p className="text-danger">
                This quiz is past due and can no longer be taken.
              </p>
            </div>
          ) : (
            <Button
              color="primary"
              onPress={handleStartQuiz}
              isLoading={submitting}
              isDisabled={submitting || isPastDue}
            >
              Start Quiz
            </Button>
          )}
        </CardBody>
      </Card>
    );
  }

  // Quiz completed view.
  if (isSubmitted) {
    return (
      <Card className="mb-4">
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Quiz Results</h2>
          {isGraded ? (
            <Chip color={score! / maxPoints >= 0.7 ? "success" : "danger"}>
              Score: {score}/{maxPoints} (
              {Math.round((score! / maxPoints) * 100)}%)
            </Chip>
          ) : (
            <Chip color="warning">Awaiting Grading</Chip>
          )}
        </CardHeader>
        <CardBody>
          {isGraded ? (
            <div>
              <Progress
                value={(score! / maxPoints) * 100}
                color={score! / maxPoints >= 0.7 ? "success" : "danger"}
                className="mb-4"
                showValueLabel={true}
              />

              <div className="space-y-4">
                {questions.map((question, index) => {
                  const response = quizResponses.find(
                    (r) => r.question_id === question.id
                  );

                  const isCorrect = response?.is_correct;
                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">Question {index + 1}</h3>
                        <div className="flex items-center">
                          <Chip
                            size="sm"
                            color={isCorrect ? "success" : "danger"}
                            startContent={
                              isCorrect ? (
                                <IconCircleCheck size={14} />
                              ) : (
                                <IconAlertCircle size={14} />
                              )
                            }
                          >
                            {isCorrect ? "Correct" : "Incorrect"} (
                            {question.points} pts)
                          </Chip>
                        </div>
                      </div>

                      <p className="mb-2">{question.question_text}</p>

                      {question.question_type === "multiple_choice" &&
                        question.options && (
                          <div className="pl-4">
                            {question.options.map((option) => {
                              const isSelected =
                                response?.response === option.id.toString();

                              const isCorrectOption = option.is_correct;
                              return (
                                <div
                                  key={option.id}
                                  className={`p-2 rounded ${isSelected ? (isCorrectOption ? "bg-success-100" : "bg-danger-100") : isCorrectOption ? "bg-success-50" : ""}`}
                                >
                                  {option.option_text}
                                  {isSelected && " (Your answer)"}
                                  {isCorrectOption &&
                                    !isSelected &&
                                    " (Correct answer)"}
                                </div>
                              );
                            })}
                          </div>
                        )}

                      {question.question_type === "short_answer" && (
                        <div className="mt-2">
                          <p className="text-sm text-default-600">
                            Your answer:
                          </p>
                          <div className="p-2 bg-default-100 rounded">
                            {response?.response || "No answer provided"}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="mb-4">
                Your quiz has been submitted and is awaiting grading.
              </p>
              {isProfessorView && (
                <Button
                  color="primary"
                  onPress={() => handleGradeQuiz(submission!.id)}
                  isLoading={submitting}
                >
                  Grade Quiz
                </Button>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    );
  }

  // Quiz in progress view.
  return (
    <Card className="mb-4">
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Quiz</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-default-600">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <Progress
            value={((currentQuestion + 1) / questions.length) * 100}
            color="primary"
            size="sm"
            className="w-24"
          />
        </div>
      </CardHeader>

      <CardBody>
        {questions.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">
                {questions[currentQuestion].question_text}
              </h3>

              {questions[currentQuestion].question_type === "multiple_choice" &&
                questions[currentQuestion].options && (
                  <RadioGroup
                    value={responses[questions[currentQuestion].id] || ""}
                    onValueChange={(value) =>
                      handleResponseChange(questions[currentQuestion].id, value)
                    }
                  >
                    {questions[currentQuestion].options.map((option) => (
                      <Radio key={option.id} value={option.id.toString()}>
                        {option.option_text}
                      </Radio>
                    ))}
                  </RadioGroup>
                )}

              {questions[currentQuestion].question_type === "short_answer" && (
                <Textarea
                  placeholder="Type your answer here..."
                  value={responses[questions[currentQuestion].id] || ""}
                  onValueChange={(value) =>
                    handleResponseChange(questions[currentQuestion].id, value)
                  }
                  rows={4}
                />
              )}
            </div>

            <div className="flex justify-between">
              <Button
                variant="bordered"
                isDisabled={currentQuestion === 0 || submitting}
                onPress={() => setCurrentQuestion(currentQuestion - 1)}
              >
                Previous
              </Button>

              {currentQuestion < questions.length - 1 ? (
                <Button
                  color="primary"
                  isDisabled={
                    !responses[questions[currentQuestion].id] || submitting
                  }
                  isLoading={submitting}
                  onPress={() =>
                    handleSubmitResponse(questions[currentQuestion].id)
                  }
                >
                  Next
                </Button>
              ) : (
                <Button
                  color="success"
                  isDisabled={
                    !responses[questions[currentQuestion].id] || submitting
                  }
                  isLoading={submitting}
                  onPress={handleFinalSubmit}
                >
                  Submit Quiz
                </Button>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
