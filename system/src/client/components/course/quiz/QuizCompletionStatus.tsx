import { Card, Chip, Divider } from "@heroui/react";
import { IconCheck } from "@tabler/icons-react";

/**
 * QuizCompletionStatus props interface.
 */
interface QuizCompletionStatusProps {
  /**
   * Number of answered questions.
   * @type {number}
   */
  answeredQuestions: number;

  /**
   * Total number of questions in the quiz.
   * @type {number}
   */
  totalQuestions: number;
}

/**
 * QuizCompletionStatus component to display the status of quiz completion.
 * @param {QuizCompletionStatusProps} props - The component props.
 * @returns {JSX.Element} The QuizCompletionStatus component.
 */
export const QuizCompletionStatus = ({
  answeredQuestions,
  totalQuestions,
}: QuizCompletionStatusProps): JSX.Element => {
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
              {answeredQuestions} / {totalQuestions}
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
