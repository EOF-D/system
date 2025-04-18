import { isProfessor } from "@/client/services/authService";
import {
  createQuizQuestion,
  getQuizQuestions,
  submitQuizResponse,
} from "@/client/services/quizService";
import {
  createSubmission,
  updateSubmission,
} from "@/client/services/submissionService";
import { CourseItem } from "@/shared/types/models/courseItem";
import { Enrollment } from "@/shared/types/models/enrollment";
import { QuizQuestionWithOptions } from "@/shared/types/models/quiz";
import {
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
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
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
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isProfessorMode] = useState(isProfessor());

  const {
    isOpen: isQuestionEditorOpen,
    onOpen: openQuestionEditor,
    onClose: closeQuestionEditor,
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
      createOrGetSubmission();
    }
  }, [courseItem.id]);

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

  const createOrGetSubmission = async () => {
    if (!enrollment) return;

    try {
      // Check if a submission already exists or create a new one.
      const submissionData = {
        enrollment_id: enrollment.id,
        item_id: courseItem.id,
        status: "draft" as "draft",
      };

      const response = await createSubmission(submissionData);
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          setError("Multiple submissions found. Please contact support.");
          return;
        }

        setSubmissionId(response.data.id);

        // If the submission is already completed, mark the quiz as completed.
        if (response.data.status === "submitted") {
          setIsCompleted(true);
        }
      } else {
        setError(response.message || "Failed to create submission");
      }
    } catch (error) {
      console.error(`Error creating submission: ${error}`);
      setError("Failed to initialize quiz. Please try again.");
    }
  };

  const handleResponseChange = (questionId: number, response: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: response,
    }));
  };

  const handleSubmitResponse = async () => {
    if (!submissionId) return;

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion || !responses[currentQuestion.id]) return;

    try {
      const response = await submitQuizResponse({
        submission_id: submissionId,
        question_id: currentQuestion.id,
        response: responses[currentQuestion.id],
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
    }
  };

  const handleFinishQuiz = async () => {
    if (!submissionId) return;

    setIsSubmitting(true);
    try {
      // Submit the final response if not already submitted.
      if (currentQuestionIndex === questions.length - 1) {
        const currentQuestion = questions[currentQuestionIndex];
        if (currentQuestion && responses[currentQuestion.id]) {
          await submitQuizResponse({
            submission_id: submissionId,
            question_id: currentQuestion.id,
            response: responses[currentQuestion.id],
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

      // Submit the question.
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
        fetchQuizQuestions();

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

  const renderQuestion = () => {
    if (questions.length === 0) return null;

    const currentQuestion = questions[currentQuestionIndex];

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
              isDisabled={isProfessorMode}
            >
              {currentQuestion.options.map((option) => (
                <Radio key={option.id} value={option.id.toString()}>
                  {option.option_text}
                  {isProfessorMode && option.is_correct ? " (Correct)" : ""}
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
              </div>
            ) : (
              <Textarea
                placeholder="Type your answer here..."
                value={responses[currentQuestion.id] || ""}
                onChange={(e) =>
                  handleResponseChange(currentQuestion.id, e.target.value)
                }
                rows={4}
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
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {isProfessorMode && (
              <Button
                color="primary"
                variant="flat"
                startContent={<IconPlus size={18} />}
                onPress={openQuestionEditor}
              >
                Add Question
              </Button>
            )}
            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                color="primary"
                disabled={!isProfessorMode && !responses[currentQuestion.id]}
                onPress={
                  isProfessorMode
                    ? () => setCurrentQuestionIndex((prev) => prev + 1)
                    : handleSubmitResponse
                }
              >
                Next
              </Button>
            ) : (
              !isProfessorMode && (
                <Button
                  color="success"
                  disabled={!responses[currentQuestion.id] || isSubmitting}
                  onPress={handleFinishQuiz}
                  isLoading={isSubmitting}
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
          Quiz Completed.
        </h3>
        <p className="text-default-600 mb-4">
          Your quiz has been submitted successfully.
        </p>
        {onSubmit && (
          <Button color="primary" onPress={onSubmit}>
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
        className="p-1"
        style={{
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: "sm",
          borderBottomRightRadius: "sm",
        }}
      >
        <Divider />
        <div style={{ padding: "20px" }}>
          <Progress
            aria-label="Quiz progress"
            value={((currentQuestionIndex + 1) / questions.length) * 100}
            color="primary"
            className="mb-2"
            style={{ marginTop: "10px", marginBottom: "10px" }}
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
      </Card>
    </div>
  );
};
