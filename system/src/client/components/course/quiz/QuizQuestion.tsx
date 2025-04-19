import { QuizQuestionWithOptions } from "@/shared/types/models/quiz";
import { Chip, Radio, RadioGroup, Textarea } from "@heroui/react";
import { IconCheck, IconX } from "@tabler/icons-react";

/**
 * QuizQuestion props interface.
 */
interface QuizQuestionProps {
  /**
   * The quiz question to be displayed.
   * @type {QuizQuestionWithOptions}
   */
  question: QuizQuestionWithOptions;

  /**
   * The student's response to the question.
   * @type {string}
   */
  response: string;

  /**
   * Callback function to handle response changes.
   * @param {number} questionId - The ID of the question.
   * @param {string} response - The updated response.
   */
  onResponseChange: (questionId: number, response: string) => void;

  /**
   * Indicates if the quiz is read-only.
   * @type {boolean}
   */
  isReadOnly: boolean;

  /**
   * Indicates if the quiz is being viewed by a student.
   * @type {boolean}
   */
  isViewingStudent: boolean;

  /**
   * Indicates if the quiz is being viewed in professor mode.
   * @type {boolean}
   */
  isProfessorMode: boolean;
}

/**
 * QuizQuestion component to display a quiz question and its options.
 * @param {QuizQuestionProps} props - The component props.
 * @returns {JSX.Element} The QuizQuestion component.
 */
export const QuizQuestion = ({
  question,
  response,
  onResponseChange,
  isReadOnly,
  isViewingStudent,
  isProfessorMode,
}: QuizQuestionProps): JSX.Element => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold mb-2">{question.question_text}</h3>
        <Chip color="primary" size="sm" variant="flat">
          {question.points} {question.points === 1 ? "point" : "points"}
        </Chip>
      </div>

      {question.question_type === "multiple_choice" && question.options && (
        <RadioGroup
          className="p-4"
          value={response}
          onValueChange={(value) => onResponseChange(question.id, value)}
          isReadOnly={isReadOnly}
        >
          {question.options.map((option) => (
            <Radio key={option.id} value={option.id.toString()}>
              <div className="flex items-center gap-2">
                {option.option_text}
                {isProfessorMode && !isViewingStudent && option.is_correct && (
                  <IconCheck size={18} className="text-success ml-2" />
                )}
                {isViewingStudent &&
                  response === option.id.toString() &&
                  (option.is_correct ? (
                    <IconCheck size={18} className="text-success ml-2" />
                  ) : (
                    <IconX size={18} className="text-danger ml-2" />
                  ))}
              </div>
            </Radio>
          ))}
        </RadioGroup>
      )}

      {question.question_type === "short_answer" && (
        <div>
          {isProfessorMode ? (
            <div className="p-4 bg-default-50 rounded-lg">
              <p className="text-default-600 italic">
                This is a short answer question. Students will provide their
                response in a text area.
              </p>
              {isViewingStudent && response && (
                <div className="mt-4 p-3 bg-white rounded border border-default-200">
                  <p className="font-medium">Student Response:</p>
                  <p>{response}</p>
                </div>
              )}
            </div>
          ) : (
            <Textarea
              placeholder="Type your answer here..."
              value={response}
              onChange={(e) => onResponseChange(question.id, e.target.value)}
              rows={4}
              isDisabled={isReadOnly}
            />
          )}
        </div>
      )}
    </div>
  );
};
