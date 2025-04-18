import { isProfessor } from "@/client/services/authService";
import { getCourseEnrollments } from "@/client/services/enrollmentService";
import {
  calculateQuizScore,
  createQuizQuestion,
  getQuizQuestions,
  getQuizResponses,
  submitQuizResponse,
} from "@/client/services/quizService";
import {
  createSubmission,
  getMySubmissions,
  getSubmissionsByItemId,
  updateSubmission,
} from "@/client/services/submissionService";
import { CourseItem } from "@/shared/types/models/courseItem";
import { Enrollment } from "@/shared/types/models/enrollment";
import {
  QuizQuestionWithOptions,
  QuizResponse,
} from "@/shared/types/models/quiz";
import { SubmissionWithDetails } from "@/shared/types/models/submission";
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Radio,
  RadioGroup,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  useDisclosure,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUserCheck,
  IconX,
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
   * @type {Enrollment}
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
 * Student response interface for professor view.
 */
interface StudentResponse {
  /**
   * The ID of the student who submitted the quiz.
   * @type {number}
   */
  studentId: number;

  /**
   * The name of the student who submitted the quiz.
   * @type {string}
   */
  studentName: string;

  /**
   * The ID of the submission.
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

  const [questions, setQuestions] = useState<QuizQuestionWithOptions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentResponses, setStudentResponses] = useState<
    Record<number, string>
  >({});

  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasCheckedSubmission, setHasCheckedSubmission] = useState(false);

  const [studentSubmissions, setStudentSubmissions] = useState<
    StudentResponse[]
  >([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );
  const [viewingStudentData, setViewingStudentData] =
    useState<StudentResponse | null>(null);

  const [isLoadingStudentData, setIsLoadingStudentData] = useState(false);
  const [isRefreshingSubmissions, setIsRefreshingSubmissions] = useState(false);

  const addQuestionDisclosure = useDisclosure();
  const studentResponsesDisclosure = useDisclosure();

  const [newQuestion, setNewQuestion] = useState({
    text: "",
    type: "multiple_choice" as "multiple_choice" | "short_answer",
    points: 1,
    options: [
      { text: "", correct: true },
      { text: "", correct: false },
    ],
  });

  useEffect(() => {
    const initializeQuiz = async () => {
      setIsLoading(true);
      setError(null);
      setHasCheckedSubmission(false);

      try {
        await fetchQuizQuestions();

        if (!isInProfessorMode && enrollment) {
          await initializeStudentView();
        } else if (isInProfessorMode) {
          await initializeProfessorView();
        }

        setIsInitialized(true);
      } catch (error) {
        console.error(`Error initializing quiz: ${error}`);
        setError("Failed to initialize quiz. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeQuiz();
  }, [courseItem.id]);

  const fetchQuizQuestions = async () => {
    try {
      const response = await getQuizQuestions(courseItem.id);

      if (response.success && response.data) {
        const questionsData = Array.isArray(response.data)
          ? response.data
          : [response.data];

        setQuestions(questionsData);
      } else {
        setError(response.message || "Failed to load quiz questions");
      }
    } catch (error) {
      console.error(`Error fetching quiz questions: ${error}`);
      throw error;
    }
  };

  const initializeStudentView = async () => {
    if (!enrollment) return;

    try {
      const existingSubmission = await checkExistingSubmission();

      if (
        !existingSubmission ||
        (existingSubmission && existingSubmission.status !== "submitted")
      ) {
        if (!submissionId) {
          await createDraftSubmission();
        }
      }

      setHasCheckedSubmission(true);
    } catch (error) {
      console.error(`Error initializing student view: ${error}`);
      throw error;
    }
  };

  const checkExistingSubmission = async () => {
    if (!enrollment) return null;

    try {
      const response = await getMySubmissions(courseItem.course_id);

      if (response.success && response.data) {
        const submissions: SubmissionWithDetails[] = Array.isArray(
          response.data
        )
          ? response.data
          : [response.data];

        const existingSubmission = submissions.find(
          (submission) => submission.item_id === courseItem.id
        );

        if (existingSubmission) {
          setSubmissionId(existingSubmission.id);

          const isSubmitted = existingSubmission.status === "submitted";
          setIsCompleted(isSubmitted);

          if (isSubmitted) {
            await loadExistingResponses(existingSubmission.id);
          }

          return existingSubmission;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error checking existing submission: ${error}`);
      throw error;
    }
  };

  const createDraftSubmission = async () => {
    if (!enrollment) return null;

    try {
      if (submissionId) {
        const response = await getMySubmissions(courseItem.course_id);

        if (response.success && response.data) {
          const submissions = Array.isArray(response.data)
            ? response.data
            : [response.data];

          const existingSubmission = submissions.find(
            (submission) => submission.id === submissionId
          );

          if (existingSubmission) {
            return existingSubmission;
          }
        }
      }

      const submissionData = {
        enrollment_id: enrollment.id,
        item_id: courseItem.id,
        status: "draft" as "draft",
      };

      const createResponse = await createSubmission(submissionData);

      if (createResponse.success && createResponse.data) {
        const submission = Array.isArray(createResponse.data)
          ? createResponse.data[0]
          : createResponse.data;

        setSubmissionId(submission.id);
        console.log("Created new draft submission:", submission.id);
        return submission;
      }

      return null;
    } catch (error) {
      console.error(`Error creating draft submission: ${error}`);
      throw error;
    }
  };

  const loadExistingResponses = async (submissionId: number) => {
    try {
      const responseData = await getQuizResponses(submissionId);

      if (
        responseData.success &&
        responseData.data &&
        responseData.data.responses
      ) {
        const responses = responseData.data.responses as QuizResponse[];
        const responseMap: Record<number, string> = {};

        responses.forEach((response) => {
          responseMap[response.question_id] = response.response;
        });

        setStudentResponses(responseMap);
      }
    } catch (error) {
      console.error(`Error loading existing responses: ${error}`);
      throw error;
    }
  };

  const initializeProfessorView = async () => {
    try {
      await fetchStudentSubmissions();
    } catch (error) {
      console.error(`Error initializing professor view: ${error}`);
      throw error;
    }
  };

  const fetchStudentSubmissions = async () => {
    setIsRefreshingSubmissions(true);

    try {
      const response = await getSubmissionsByItemId(courseItem.id);

      if (response.success && response.data) {
        const submissions = Array.isArray(response.data)
          ? response.data
          : [response.data];

        const studentResponsesData: StudentResponse[] = await Promise.all(
          submissions.map(async (submission: SubmissionWithDetails) => {
            let responses: Record<number, string> = {};
            let score = 0;

            if (submission.status === "submitted") {
              try {
                const quizResponseData = await getQuizResponses(submission.id);

                if (
                  quizResponseData.success &&
                  quizResponseData.data &&
                  quizResponseData.data.responses
                ) {
                  const responseList = quizResponseData.data
                    .responses as QuizResponse[];

                  responseList.forEach((response) => {
                    responses[response.question_id] = response.response;
                  });

                  // Calculate score if available.
                  if (
                    submission.points_earned !== undefined &&
                    submission.points_earned !== null
                  ) {
                    score = Math.round(
                      (submission.points_earned / courseItem.max_points) * 100
                    );
                  }
                }
              } catch (error) {
                console.error(
                  `Error fetching responses for submission ${submission.id}: ${error}`
                );
              }
            }

            // Get student ID from enrollments.
            let studentId;
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

            return {
              studentId: studentId || 0,
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

  const handleResponseChange = async (questionId: number, response: string) => {
    // If we haven't checked for existing submissions yet, do that first.
    if (!hasCheckedSubmission && !isInProfessorMode && enrollment) {
      await initializeStudentView();
    }

    // If we don't have a submission ID yet, create a draft.
    if (!submissionId && !isInProfessorMode && enrollment) {
      const submission = await createDraftSubmission();
      if (submission) {
        setStudentResponses((prev) => ({
          ...prev,
          [questionId]: response,
        }));
      }
    } else {
      setStudentResponses((prev) => ({
        ...prev,
        [questionId]: response,
      }));
    }
  };

  const handleSubmitResponse = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion || !studentResponses[currentQuestion.id]) return;

    if (!submissionId && enrollment) {
      const submission = await createDraftSubmission();
      if (!submission) {
        setError("Failed to create submission. Please try again.");
        return;
      }
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
        // Continue anyway to show the next question.
      }
    }

    // Move to the next question.
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleFinishQuiz = async () => {
    if (!submissionId && enrollment) {
      const submission = await createDraftSubmission();
      if (!submission) {
        setError("Failed to create submission. Please try again.");
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
      } else {
        setError(response.message || "Failed to submit quiz");
      }
    } catch (error) {
      console.error(`Error finishing quiz: ${error}`);
      setError("Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
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
        if (Object.keys(student.responses).length === 0 && student.completed) {
          const quizResponseData = await getQuizResponses(student.submissionId);

          if (
            quizResponseData.success &&
            quizResponseData.data &&
            quizResponseData.data.responses
          ) {
            const responseList = quizResponseData.data
              .responses as QuizResponse[];
            const responses: Record<number, string> = {};

            responseList.forEach((response) => {
              responses[response.question_id] = response.response;
            });

            student.responses = responses;
          }
        }

        setViewingStudentData(student);
        setIsViewingStudentSubmission(true);
        setCurrentQuestionIndex(0); // Reset to first question.
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

  const handleExitStudentView = () => {
    setIsViewingStudentSubmission(false);
    setViewingStudentData(null);
    setCurrentQuestionIndex(0);
  };

  const handleAddOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, { text: "", correct: false }],
    });
  };

  const handleRemoveOption = (index: number) => {
    // Don't allow removing if only 2 options remain.
    if (newQuestion.options.length <= 2) return;

    setNewQuestion({
      ...newQuestion,
      options: newQuestion.options.filter((_, i) => i !== index),
    });
  };

  const handleOptionChange = (index: number, text: string) => {
    setNewQuestion({
      ...newQuestion,
      options: newQuestion.options.map((option, i) =>
        i === index ? { ...option, text } : option
      ),
    });
  };

  const handleCorrectOptionChange = (index: number) => {
    // Allow only one correct answer.
    setNewQuestion({
      ...newQuestion,
      options: newQuestion.options.map((option, i) => ({
        ...option,
        correct: i === index,
      })),
    });
  };

  const handleAddQuestion = async () => {
    setIsSubmitting(true);

    try {
      const questionData = {
        item_id: courseItem.id,
        question_text: newQuestion.text,
        question_type: newQuestion.type,
        points: newQuestion.points,
        options:
          newQuestion.type === "multiple_choice"
            ? newQuestion.options.map((option) => ({
                option_text: option.text,
                is_correct: option.correct,
              }))
            : undefined,
      };

      const response = await createQuizQuestion(questionData);
      if (response.success) {
        setNewQuestion({
          text: "",
          type: "multiple_choice",
          points: 1,
          options: [
            { text: "", correct: true },
            { text: "", correct: false },
          ],
        });

        addQuestionDisclosure.onClose();
        await fetchQuizQuestions();

        if (onRefresh) {
          onRefresh();
        }
      } else {
        setError(response.message || "Failed to add question");
      }
    } catch (error) {
      console.error(`Error adding question: ${error}`);
      setError("Failed to add question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    if (questions.length === 0) return null;

    const currentQuestion = questions[currentQuestionIndex];
    const isViewingStudent = isInProfessorMode && isViewingStudentSubmission;

    const responses =
      isViewingStudent && viewingStudentData
        ? viewingStudentData.responses
        : studentResponses;

    return (
      <div className="flex flex-col space-y-4" style={{ padding: "20px" }}>
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold mb-2">
            {currentQuestion.question_text}
          </h3>
          <Chip color="primary" size="sm" variant="flat">
            {currentQuestion.points}{" "}
            {currentQuestion.points === 1 ? "point" : "points"}
          </Chip>
        </div>

        {currentQuestion.question_type === "multiple_choice" &&
          currentQuestion.options && (
            <RadioGroup
              className="p-4"
              value={responses[currentQuestion.id] || ""}
              onValueChange={(value) =>
                handleResponseChange(currentQuestion.id, value)
              }
              isReadOnly={isInProfessorMode || isSubmitting || isCompleted}
            >
              {currentQuestion.options.map((option) => (
                <Radio
                  className="data-disabled:opacity-enable"
                  key={option.id}
                  value={option.id.toString()}
                >
                  <div className="flex items-center gap-2">
                    {option.option_text}
                    {isInProfessorMode && option.is_correct ? (
                      <IconCheck size={18} className="text-success ml-2" />
                    ) : (
                      <></>
                    )}
                    {isViewingStudent &&
                    !isInProfessorMode &&
                    responses[currentQuestion.id] === option.id.toString() &&
                    option.is_correct ? (
                      <IconCheck size={18} className="text-success ml-2" />
                    ) : (
                      <></>
                    )}

                    {isViewingStudent &&
                    responses[currentQuestion.id] === option.id.toString() &&
                    !option.is_correct ? (
                      <IconX size={18} className="text-danger ml-2" />
                    ) : (
                      <></>
                    )}
                  </div>
                </Radio>
              ))}
            </RadioGroup>
          )}

        {currentQuestion.question_type === "short_answer" && (
          <div>
            {isInProfessorMode ? (
              <div className="p-4 bg-default-50 rounded-lg">
                <p className="text-default-600 italic">
                  This is a short answer question. Students will provide their
                  response in a text area.
                </p>
                {isViewingStudent && responses[currentQuestion.id] && (
                  <div className="mt-4 p-3 bg-white rounded border border-default-200">
                    <p className="font-medium">Student Response:</p>
                    <p>{responses[currentQuestion.id]}</p>
                  </div>
                )}
              </div>
            ) : (
              <Textarea
                placeholder="Type your answer here..."
                value={responses[currentQuestion.id] || ""}
                onChange={(e) =>
                  handleResponseChange(currentQuestion.id, e.target.value)
                }
                rows={4}
                isDisabled={isSubmitting || isCompleted}
              />
            )}
          </div>
        )}

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
    );
  };

  const renderQuestionEditor = () => {
    return (
      <Modal
        isOpen={addQuestionDisclosure.isOpen}
        onClose={addQuestionDisclosure.onClose}
        size="lg"
        radius="lg"
        classNames={{
          backdrop:
            "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">Add New Question</h3>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Textarea
                label="Question Text"
                placeholder="Enter your question here..."
                value={newQuestion.text}
                onValueChange={(value) =>
                  setNewQuestion({ ...newQuestion, text: value })
                }
                variant="bordered"
                isRequired
              />

              <div className="flex gap-4">
                <div className="flex-1">
                  <Select
                    label="Question Type"
                    placeholder="Multiple Choice"
                    value={newQuestion.type}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        type: e.target.value as
                          | "multiple_choice"
                          | "short_answer",
                      })
                    }
                    variant="flat"
                  >
                    <SelectItem key="multiple_choice">
                      Multiple Choice
                    </SelectItem>
                    <SelectItem key="short_answer">Short Answer</SelectItem>
                  </Select>
                </div>

                <Input
                  type="number"
                  label="Points"
                  min={1}
                  value={newQuestion.points.toString()}
                  onValueChange={(value) =>
                    setNewQuestion({
                      ...newQuestion,
                      points: parseInt(value) || 1,
                    })
                  }
                  className="flex-1"
                />
              </div>

              {newQuestion.type === "multiple_choice" && (
                <div>
                  <h4 className="text-md font-medium mb-5">
                    Multiple Choice Options
                  </h4>

                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex gap-1 mb-5">
                      <Checkbox
                        isSelected={option.correct}
                        onChange={() => handleCorrectOptionChange(index)}
                        aria-label="Correct answer"
                        radius="lg"
                      />
                      <Input
                        className="flex-1"
                        placeholder={`Option ${index + 1}...`}
                        value={option.text}
                        onValueChange={(value) =>
                          handleOptionChange(index, value)
                        }
                      />
                      {newQuestion.options.length > 2 && (
                        <Button
                          isIconOnly
                          color="danger"
                          variant="light"
                          onPress={() => handleRemoveOption(index)}
                          size="sm"
                        >
                          <IconTrash size={20} />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    isIconOnly
                    className="w-full"
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={handleAddOption}
                  >
                    <IconPlus size={30} />
                  </Button>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="flat"
              onPress={addQuestionDisclosure.onClose}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAddQuestion}
              isLoading={isSubmitting}
              isDisabled={
                !newQuestion.text ||
                (newQuestion.type === "multiple_choice" &&
                  newQuestion.options.some((option) => !option.text))
              }
            >
              Add Question
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  const renderStudentResponsesModal = () => {
    return (
      <Modal
        isOpen={studentResponsesDisclosure.isOpen}
        onClose={studentResponsesDisclosure.onClose}
        size="xl"
        classNames={{
          backdrop:
            "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
        }}
        radius="lg"
      >
        <ModalContent>
          <ModalHeader className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Student Responses</h3>
          </ModalHeader>
          <ModalBody style={{ paddingBottom: "40px" }}>
            <div className="flex flex-col gap-4">
              {studentSubmissions.length === 0 ? (
                <p className="text-default-500 text-center py-4">
                  No submissions found for this quiz.
                </p>
              ) : (
                <>
                  <Table removeWrapper aria-label="Student submissions">
                    <TableHeader>
                      <TableColumn>STUDENT</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>SCORE</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {studentSubmissions.map((submission) => (
                        <TableRow key={submission.submissionId}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={submission.studentName}
                                size="sm"
                                color="primary"
                                isBordered
                              />
                              <span className="font-medium">
                                {submission.studentName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              color={
                                submission.completed ? "success" : "warning"
                              }
                              variant="flat"
                              size="sm"
                            >
                              {submission.completed
                                ? "Completed"
                                : "In Progress"}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            {submission.completed
                              ? submission.score !== undefined
                                ? `${submission.score}%`
                                : "Not graded"
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              onPress={() => {
                                setSelectedStudentId(
                                  submission.studentId.toString()
                                );
                                loadStudentSubmission(
                                  submission.studentId.toString()
                                );
                                studentResponsesDisclosure.onClose();
                              }}
                              isDisabled={!submission.completed}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  };

  const renderProgressBar = () => {
    if (questions.length === 0) return null;

    const progress = Math.round(
      ((currentQuestionIndex + 1) / questions.length) * 100
    );

    return (
      <div style={{ margin: "10px" }}>
        <div className="flex justify-between text-sm text-default-600 mb-1">
          <span>
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span>{progress}% Complete</span>
        </div>
        <Progress
          value={progress}
          color="primary"
          size="md"
          radius="sm"
          aria-label="Quiz progress"
        />
      </div>
    );
  };

  const renderQuizStatus = () => {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ paddingTop: "40px", paddingBottom: "40px" }}
      >
        <div className="mb-6">
          <div className="flex">
            <h3 className="text-2xl font-bold mb-2">Quiz Submitted</h3>
            <IconCheck size={35} className="text-success mb-4" />
          </div>
        </div>
        <Card className="w-full max-w-md p-4 shadow-none">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="text-default-600">Questions Answered:</span>
              <span className="font-medium">
                {Object.keys(studentResponses).length} / {questions.length}
              </span>
            </div>
            <Divider className="my-2" />
            <div className="flex justify-between">
              <span className="text-default-600">Status:</span>
              <Chip color="success" size="sm" variant="flat">
                Completed
              </Chip>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderProfessorTools = () => {
    return (
      <div>
        {isViewingStudentSubmission && (
          <div className="mb-4">
            <Button
              color="default"
              variant="light"
              radius="none"
              startContent={<IconChevronLeft size={18} />}
              onPress={handleExitStudentView}
            >
              Back to All Submissions
            </Button>
            <div className="mt-4 p-4 bg-default-50 rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  {viewingStudentData?.studentName}'s Submission
                </h3>
                {viewingStudentData?.score !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-default-600">Score:</span>
                    <Chip color="primary" size="md">
                      {viewingStudentData.score}%
                    </Chip>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-12">
          <Spinner size="lg" color="primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6 text-center">
          <p className="text-danger mb-4">{error}</p>
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
      return renderQuizStatus();
    }

    return (
      <div className="flex flex-col w-full">
        {renderProgressBar()}
        {renderQuestion()}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full">
      {isInProfessorMode && renderProfessorTools()}
      {renderContent()}
      {renderQuestionEditor()}
      {renderStudentResponsesModal()}
    </div>
  );
};
