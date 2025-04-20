import { TextEditor } from "@/client/components/TextEditor";
import { QuizQuestionWithOptions } from "@/shared/types/models/quiz";
import { Radio, RadioGroup } from "@heroui/react";
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
      <div className="flex justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="text-default-600">Points:</span>
          <span className="font-medium">{question.points}</span>
        </div>
      </div>

      <TextEditor content={question.question_text} isReadOnly={true} />

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
                <span className="text-default-600">{option.option_text}</span>
                {isProfessorMode && !isViewingStudent && option.is_correct ? (
                  <IconCheck size={18} className="text-success ml-2" />
                ) : (
                  <></>
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
              {!isViewingStudent && (
                <p className="text-default-600 italic">
                  This is a short answer question. Students will provide their
                  response in a rich text editor.
                </p>
              )}
              {isViewingStudent && response && (
                <div>
                  <p className="font-medium">Student Response:</p>
                  <TextEditor content={response} isReadOnly={true} />
                </div>
              )}
            </div>
          ) : (
            <TextEditor
              content={response}
              onChangeContent={(value: string) =>
                onResponseChange(question.id, value)
              }
            />
          )}
        </div>
      )}
    </div>
  );
};
