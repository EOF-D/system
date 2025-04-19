import { StudentResponse } from "@/client/hooks/useQuizSubmission";
import { Button, Chip } from "@heroui/react";
import { IconChevronLeft } from "@tabler/icons-react";

/**
 * QuizProfessorTools props interface.
 */
interface QuizProfessorToolsProps {
  /**
   * Indicates if the professor is viewing a student's submission.
   * @type {boolean}
   */
  isViewingStudentSubmission: boolean;

  /**
   * The data of the student being viewed.
   * @type {StudentResponse | null}
   */
  viewingStudentData: StudentResponse | null;

  /**
   * Callback function to exit the student view.
   * @type {function}
   */
  onExitStudentView: () => void;
}

/**
 * QuizProfessorTools component to display tools for professors to view student submissions.
 * @param {QuizProfessorToolsProps} props - The component props.
 * @returns {JSX.Element} The QuizProfessorTools component.
 */
export const QuizProfessorTools = ({
  isViewingStudentSubmission,
  viewingStudentData,
  onExitStudentView,
}: QuizProfessorToolsProps): JSX.Element => {
  if (!isViewingStudentSubmission) {
    return <></>;
  }

  return (
    <div className="mb-4">
      <Button
        color="default"
        variant="light"
        radius="none"
        startContent={<IconChevronLeft size={18} />}
        onPress={onExitStudentView}
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
  );
};
