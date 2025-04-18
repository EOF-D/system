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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
  useDisclosure,
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
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestionWithOptions[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProfessorMode] = useState(isProfessor());

  const [studentResponses, setStudentResponses] = useState<
    Record<number, string>
  >({});
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

  const {
    isOpen: isQuestionEditorOpen,
    onOpen: openQuestionEditor,
    onClose: closeQuestionEditor,
  } = useDisclosure();

  const {
    isOpen: isResponsesModalOpen,
    onOpen: openResponsesModal,
    onClose: closeResponsesModal,
  } = useDisclosure();

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
    fetchQuizQuestions();

    if (!isProfessorMode && enrollment) {
      initializeStudentView();
    } else if (isProfessorMode) {
      initializeProfessorView();
    }
  }, [courseItem.id]);

  const initializeStudentView = async () => {
    if (!enrollment) return;

    try {
      await checkExistingSubmission();
    } catch (error) {
      console.error(`Error initializing student view: ${error}`);
      setError("Failed to initialize quiz. Please try again.");
    }
  };

  const initializeProfessorView = async () => {
    try {
      await fetchStudentSubmissions();
    } catch (error) {
      console.error(`Error initializing professor view: ${error}`);
      setError("Failed to load student submissions. Please try again.");
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
            // For each submission, get the responses.
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

            let studentId = undefined;
            const response = await getCourseEnrollments(courseItem.course_id);
            if (Array.isArray(response.data)) {
              const student = response.data.find(
                (enrollment) => enrollment.id === submission.enrollment_id
              );

              if (!student) {
                console.error(
                  `Student not found for submission ${submission.id}`
                );

                return;
              }
            }

            return {
              studentId: studentId,
              studentName: submission.student_full_name || "Unknown Student",
              submissionId: submission.id,
              completed: submission.status === "submitted",
              responses,
              score: score,
            };
          })
        );

        setStudentSubmissions(studentResponsesData);
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
        // If we don't have responses yet, fetch them.
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

            // Update the student data with responses.
            student.responses = responses;
          }
        }

        setViewingStudentData(student);
        setViewingStudentResponses(true);
        setCurrentQuestionIndex(0); // Reset to first question.
      }
    } catch (error) {
      console.error(`Error loading student submission: ${error}`);
      setError("Failed to load student responses. Please try again.");
    } finally {
      setIsLoadingStudentData(false);
    }
  };

  const checkExistingSubmission = async () => {
    if (!enrollment) return;

    try {
      // Try to create a submission or get existing one.
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

        // If submission is already submitted, load responses and mark as completed.
        if (submission.status === "submitted") {
          setIsCompleted(true);
          await loadExistingResponses(submission.id);
        }
      } else {
        setError(response.message || "Failed to create submission");
      }
    } catch (error) {
      console.error(`Error checking existing submission: ${error}`);
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

  const fetchQuizQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await getQuizQuestions(courseItem.id);
      if (response.success && response.data) {
        setQuestions(
          Array.isArray(response.data) ? response.data : [response.data]
        );
      } else {
        setError(response.message || "Failed to load quiz questions");
      }
    } catch (error) {
      console.error(`Error fetching quiz questions: ${error}`);
      setError("Failed to load quiz questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseChange = (questionId: number, response: string) => {
    setStudentResponses((prev) => ({
      ...prev,
      [questionId]: response,
    }));
  };

  const handleSubmitResponse = async () => {
    if (!submissionId) return;

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion || !studentResponses[currentQuestion.id]) return;

    try {
      setIsSubmitting(true);

      const response = await submitQuizResponse({
        submission_id: submissionId,
        question_id: currentQuestion.id,
        response: studentResponses[currentQuestion.id],
      });

      if (!response.success) {
        setError(response.message || "Failed to submit response");
        return;
      }

      // Move to the next question if there is one.
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    } catch (error) {
      console.error(`Error submitting response: ${error}`);
      setError("Failed to submit response. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishQuiz = async () => {
    if (!submissionId) return;

    setIsSubmitting(true);
    try {
      // Submit the final response if not already submitted.
      if (currentQuestionIndex === questions.length - 1) {
        const currentQuestion = questions[currentQuestionIndex];
        if (currentQuestion && studentResponses[currentQuestion.id]) {
          await submitQuizResponse({
            submission_id: submissionId,
            question_id: currentQuestion.id,
            response: studentResponses[currentQuestion.id],
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
    setViewingStudentResponses(false);
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

        closeQuestionEditor();
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

  const renderQuestionEditor = () => {
    return (
      <Modal
        isOpen={isQuestionEditorOpen}
        onClose={closeQuestionEditor}
        size="lg"
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
                  <select
                    className="w-full p-2 rounded-lg border border-default-300"
                    value={newQuestion.type}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        type: e.target.value as
                          | "multiple_choice"
                          | "short_answer",
                      })
                    }
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="short_answer">Short Answer</option>
                  </select>
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
                  <div
                    className="flex justify-between items-center"
                    style={{ marginBottom: "20px" }}
                  >
                    <h4 className="text-md font-medium">Answer Options</h4>
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      onPress={handleAddOption}
                    >
                      <IconPlus size={16} />
                      Add Option
                    </Button>
                  </div>

                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Checkbox
                        isSelected={option.correct}
                        onValueChange={() => handleCorrectOptionChange(index)}
                        aria-label="Correct answer"
                      />
                      <Input
                        className="flex-1 mb-2"
                        placeholder={`Option ${index + 1}`}
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
                          <IconTrash size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="flat"
              onPress={closeQuestionEditor}
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
        isOpen={isResponsesModalOpen}
        onClose={closeResponsesModal}
        size="xl"
      >
        <ModalContent>
          <ModalHeader className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Student Responses</h3>
            <Button
              color="primary"
              variant="light"
              isIconOnly
              onPress={fetchStudentSubmissions}
              isLoading={isRefreshingSubmissions}
            >
              <IconRefresh size={18} />
            </Button>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Tabs>
                <Tab key="summary" title="Summary">
                  <div className="p-4">
                    <div className="flex justify-between mb-4">
                      <h4 className="text-lg font-medium">Class Statistics</h4>
                      <Chip color="primary" variant="flat">
                        {studentSubmissions.length} Students
                      </Chip>
                    </div>
                    <div className="bg-default-50 p-4 rounded-lg">
                      {studentSubmissions.length === 0 ? (
                        <p className="text-center text-default-500 py-4">
                          No student submissions yet
                        </p>
                      ) : (
                        <div>
                          <p className="mb-2">
                            <strong>Completion Rate:</strong>{" "}
                            {Math.round(
                              (studentSubmissions.filter((s) => s.completed)
                                .length /
                                studentSubmissions.length) *
                                100
                            )}
                            %
                          </p>
                          {studentSubmissions.some(
                            (s) => s.score !== undefined
                          ) && (
                            <p className="mb-2">
                              <strong>Average Score:</strong>{" "}
                              {Math.round(
                                studentSubmissions
                                  .filter((s) => s.score !== undefined)
                                  .reduce((sum, s) => sum + (s.score || 0), 0) /
                                  studentSubmissions.filter(
                                    (s) => s.score !== undefined
                                  ).length
                              )}
                              %
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <h4 className="text-lg font-medium mb-4">Student List</h4>
                      <Table aria-label="Student submissions table">
                        <TableHeader>
                          <TableColumn>STUDENT</TableColumn>
                          <TableColumn>STATUS</TableColumn>
                          <TableColumn>SCORE</TableColumn>
                          <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="No student submissions available">
                          {studentSubmissions.map((student) => (
                            <TableRow key={student.studentId}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar
                                    name={student.studentName}
                                    size="sm"
                                    color="primary"
                                  />
                                  <span>{student.studentName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  color={
                                    student.completed ? "success" : "warning"
                                  }
                                  variant="flat"
                                >
                                  {student.completed
                                    ? "Completed"
                                    : "In Progress"}
                                </Chip>
                              </TableCell>
                              <TableCell>
                                {student.score !== undefined
                                  ? `${student.score}/${courseItem.max_points}`
                                  : "Not graded"}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    onPress={() => {
                                      setSelectedStudent(
                                        student.studentId.toString()
                                      );
                                      loadStudentSubmission(
                                        student.studentId.toString()
                                      );
                                      closeResponsesModal();
                                    }}
                                    isDisabled={!student.completed}
                                  >
                                    View Responses
                                  </Button>
                                  {student.completed &&
                                    student.score === undefined && (
                                      <Button
                                        size="sm"
                                        color="secondary"
                                        variant="flat"
                                        onPress={() =>
                                          handleCalculateScore(
                                            student.submissionId
                                          )
                                        }
                                        isDisabled={isLoadingStudentData}
                                      >
                                        Grade
                                      </Button>
                                    )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </Tab>
                <Tab key="individual" title="Individual Results">
                  <div className="p-4">
                    {studentSubmissions.length === 0 ? (
                      <p className="text-center text-default-500">
                        No student submissions yet
                      </p>
                    ) : (
                      <div>
                        <div className="mb-4">
                          <select
                            className="w-full p-2 rounded-lg border border-default-300"
                            value={selectedStudent || ""}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                          >
                            <option value="">Select a student</option>
                            {studentSubmissions
                              .filter((s) => s.completed)
                              .map((s) => (
                                <option key={s.studentId} value={s.studentId}>
                                  {s.studentName}{" "}
                                  {s.score !== undefined
                                    ? `(${s.score}/${courseItem.max_points})`
                                    : ""}
                                </option>
                              ))}
                          </select>
                        </div>

                        {selectedStudent && (
                          <Button
                            color="primary"
                            onPress={() => {
                              loadStudentSubmission(selectedStudent);
                              closeResponsesModal();
                            }}
                            isLoading={isLoadingStudentData}
                          >
                            View Responses
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={closeResponsesModal}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  const renderQuestion = () => {
    if (questions.length === 0) return null;

    const currentQuestion = questions[currentQuestionIndex];
    const isViewingStudent = isProfessorMode && viewingStudentResponses;

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
              value={responses[currentQuestion.id] || ""}
              onValueChange={(value) =>
                handleResponseChange(currentQuestion.id, value)
              }
              isDisabled={isProfessorMode || isSubmitting || isCompleted}
            >
              {currentQuestion.options.map((option) => (
                <Radio key={option.id} value={option.id.toString()}>
                  <div className="flex items-center">
                    {option.option_text}
                    {isProfessorMode && option.is_correct && (
                      <Chip
                        color="success"
                        size="sm"
                        variant="flat"
                        className="ml-2"
                      >
                        Correct
                      </Chip>
                    )}
                    {isViewingStudent &&
                      responses[currentQuestion.id] === option.id.toString() &&
                      option.is_correct && (
                        <IconCheck size={18} className="text-success ml-2" />
                      )}
                    {isViewingStudent &&
                      responses[currentQuestion.id] === option.id.toString() &&
                      !option.is_correct && (
                        <IconX size={18} className="text-danger ml-2" />
                      )}
                  </div>
                </Radio>
              ))}
            </RadioGroup>
          )}

        {currentQuestion.question_type === "short_answer" && (
          <div>
            {isProfessorMode ? (
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
            {isProfessorMode && !isViewingStudent && (
              <Button
                color="primary"
                variant="flat"
                startContent={<IconPlus size={18} />}
                onPress={openQuestionEditor}
              >
                Add Question
              </Button>
            )}

            {isProfessorMode && !isViewingStudent && (
              <Button
                color="secondary"
                variant="flat"
                startContent={<IconUserCheck size={18} />}
                onPress={openResponsesModal}
              >
                View Responses
              </Button>
            )}

            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                color="primary"
                disabled={
                  (!isProfessorMode && !responses[currentQuestion.id]) ||
                  isSubmitting ||
                  isCompleted
                }
                onPress={
                  isProfessorMode
                    ? () => setCurrentQuestionIndex((prev) => prev + 1)
                    : handleSubmitResponse
                }
                endContent={<IconChevronRight size={18} />}
                isLoading={isSubmitting}
              >
                Next
              </Button>
            ) : (
              !isProfessorMode && (
                <Button
                  color="success"
                  disabled={
                    !responses[currentQuestion.id] ||
                    isSubmitting ||
                    isCompleted
                  }
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-50 p-4 rounded-lg text-danger-700">
        <p>{error}</p>
        <Button
          className="mt-2"
          color="primary"
          variant="flat"
          onPress={() => {
            setError(null);
            fetchQuizQuestions();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!isProfessorMode && isCompleted) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-xl font-semibold text-success-600 mb-2">
          Quiz Completed
        </h3>
        <p className="text-default-600 mb-4">
          Your quiz has been submitted successfully.
        </p>
        {onSubmit && (
          <Button color="primary" onPress={onSubmit} radius="full">
            Return to Course Materials
          </Button>
        )}
      </Card>
    );
  }

  if (isProfessorMode && questions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-xl font-semibold mb-3">No Questions Yet</h3>
        <p className="text-default-600 mb-4">
          This quiz doesn't have any questions yet.
        </p>
        <Button
          color="primary"
          startContent={<IconPlus size={18} />}
          onPress={openQuestionEditor}
          radius="full"
        >
          Add Question
        </Button>
        {renderQuestionEditor()}
      </Card>
    );
  }

  return (
    <div>
      <Card
        className="p-1 shadow-md"
        style={{
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: "sm",
          borderBottomRightRadius: "sm",
        }}
      >
        <div style={{ padding: "20px" }}>
          {isProfessorMode && viewingStudentResponses && viewingStudentData && (
            <div className="bg-primary-50 p-3 rounded-lg mb-4 flex flex-col">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium flex items-center">
                    <Avatar
                      name={viewingStudentData.studentName}
                      size="sm"
                      className="mr-2"
                    />
                    {viewingStudentData.studentName}'s Responses
                  </h4>
                  {viewingStudentData.score !== undefined && (
                    <p className="text-sm mt-1">
                      Score: {viewingStudentData.score}/{courseItem.max_points}(
                      {Math.round(
                        (viewingStudentData.score / courseItem.max_points) * 100
                      )}
                      %)
                    </p>
                  )}
                </div>
                <Button
                  color="default"
                  variant="flat"
                  onPress={handleExitStudentView}
                  size="sm"
                >
                  Exit Student View
                </Button>
              </div>

              {viewingStudentData.score === undefined && (
                <div className="mt-3 flex justify-end">
                  <Button
                    color="primary"
                    size="sm"
                    variant="flat"
                    onPress={() =>
                      handleCalculateScore(viewingStudentData.submissionId)
                    }
                    isLoading={isLoadingStudentData}
                  >
                    Grade Quiz
                  </Button>
                </div>
              )}
            </div>
          )}

          <Progress
            aria-label="Quiz progress"
            value={((currentQuestionIndex + 1) / questions.length) * 100}
            color="primary"
            className="mb-2"
            size="md"
          />
          <div className="flex justify-between text-sm text-default-500">
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span>
              {Math.round(
                ((currentQuestionIndex + 1) / questions.length) * 100
              )}
              % Complete
            </span>
          </div>
        </div>

        <Divider style={{ marginBottom: "20px" }} />
        {renderQuestion()}
        {renderQuestionEditor()}
        {renderStudentResponsesModal()}
      </Card>
    </div>
  );
};
