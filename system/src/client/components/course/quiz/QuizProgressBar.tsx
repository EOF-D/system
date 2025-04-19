import { Progress } from "@heroui/react";

/**
 * QuizProgressBar props interface.
 */
interface QuizProgressBarProps {
  /**
   * Current question index.
   * @type {number}
   */
  currentIndex: number;

  /**
   * Total number of questions in the quiz.
   * @type {number}
   */
  totalQuestions: number;
}

/**
 * QuizProgressBar component to display the progress of the quiz.
 * @param {QuizProgressBarProps} props - The component props.
 * @returns {JSX.Element | null} The QuizProgressBar component or null if no questions.
 */
export const QuizProgressBar = ({
  currentIndex,
  totalQuestions,
}: QuizProgressBarProps): JSX.Element | null => {
  if (totalQuestions === 0) return null;

  const progress = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  return (
    <div style={{ margin: "10px" }}>
      <div className="flex justify-between text-sm text-default-600 mb-1">
        <span>
          Question {currentIndex + 1} of {totalQuestions}
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
