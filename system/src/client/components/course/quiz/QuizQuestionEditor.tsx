import { TextEditor } from "@/client/components/TextEditor";
import { createQuizQuestion } from "@/client/services/quizService";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

/**
 * QuizQuestionEditor props interface.
 */
interface QuizQuestionEditorProps {
  /**
   * Indicates if the modal is open.
   * @type {boolean}
   */
  isOpen: boolean;

  /**
   * Callback function to close the modal.
   * @type {function}
   */
  onClose: () => void;

  /**
   * The ID of the course item.
   * @type {number}
   */
  courseItemId: number;

  /**
   * Callback function to be called when a question is added.
   * @type {function}
   */
  onQuestionAdded: () => void;
}

/**
 * QuizQuestionEditor component to add a new quiz question.
 * @param {QuizQuestionEditorProps} props - The component props.
 * @return {JSX.Element} The QuizQuestionEditor component.
 */
export const QuizQuestionEditor = ({
  isOpen,
  onClose,
  courseItemId,
  onQuestionAdded,
}: QuizQuestionEditorProps): JSX.Element => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionData, setQuestionData] = useState({
    text: "",
    type: "multiple_choice" as "multiple_choice" | "short_answer",
    points: 1,
    options: [
      { text: "", correct: true },
      { text: "", correct: false },
    ],
  });

  const handleAddOption = () => {
    setQuestionData({
      ...questionData,
      options: [...questionData.options, { text: "", correct: false }],
    });
  };

  const handleRemoveOption = (index: number) => {
    // Don't allow removing if only 2 options remain.
    if (questionData.options.length <= 2) return;

    setQuestionData({
      ...questionData,
      options: questionData.options.filter((_, i) => i !== index),
    });
  };

  const handleOptionChange = (index: number, text: string) => {
    setQuestionData({
      ...questionData,
      options: questionData.options.map((option, i) =>
        i === index ? { ...option, text } : option
      ),
    });
  };

  const handleCorrectOptionChange = (index: number) => {
    // Allow only one correct answer.
    setQuestionData({
      ...questionData,
      options: questionData.options.map((option, i) => ({
        ...option,
        correct: i === index,
      })),
    });
  };

  const handleAddQuestion = async () => {
    setIsSubmitting(true);

    try {
      const questionDataPayload = {
        item_id: courseItemId,
        question_text: questionData.text,
        question_type: questionData.type,
        points: questionData.points,
        options:
          questionData.type === "multiple_choice"
            ? questionData.options.map((option) => ({
                option_text: option.text,
                is_correct: option.correct,
              }))
            : undefined,
      };

      const response = await createQuizQuestion(questionDataPayload);
      if (response.success) {
        resetForm();
        onClose();
        onQuestionAdded();
      }
    } catch (error) {
      console.error(`Error adding question: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setQuestionData({
      text: "",
      type: "multiple_choice",
      points: 1,
      options: [
        { text: "", correct: true },
        { text: "", correct: false },
      ],
    });
  };

  return (
    <Modal
      isDismissable={false}
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
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
            <div className="mb-2">
              <label className="block text-sm font-medium mb-2">
                Question Text
              </label>
              <TextEditor
                content={questionData.text}
                onChangeContent={(value: string) =>
                  setQuestionData({ ...questionData, text: value })
                }
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Select
                  label="Question Type"
                  placeholder="Multiple Choice"
                  value={questionData.type}
                  onChange={(e) =>
                    setQuestionData({
                      ...questionData,
                      type: e.target.value as
                        | "multiple_choice"
                        | "short_answer",
                    })
                  }
                  variant="flat"
                >
                  <SelectItem key="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem key="short_answer">Short Answer</SelectItem>
                </Select>
              </div>

              <Input
                type="number"
                label="Points"
                min={1}
                value={questionData.points.toString()}
                onValueChange={(value) =>
                  setQuestionData({
                    ...questionData,
                    points: parseInt(value) || 1,
                  })
                }
                className="flex-1"
              />
            </div>

            {questionData.type === "multiple_choice" && (
              <div>
                <h4 className="text-md font-medium mb-5">
                  Multiple Choice Options
                </h4>

                {questionData.options.map((option, index) => (
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
                    {questionData.options.length > 2 && (
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
          <Button color="default" variant="flat" onPress={onClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleAddQuestion}
            isLoading={isSubmitting}
            isDisabled={
              !questionData.text ||
              (questionData.type === "multiple_choice" &&
                questionData.options.some((option) => !option.text))
            }
          >
            Add Question
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
