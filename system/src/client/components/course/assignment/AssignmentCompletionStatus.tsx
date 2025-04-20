import { Card, Chip, Divider } from "@heroui/react";
import { IconCheck } from "@tabler/icons-react";

/**
 * AssignmentCompletionStatus props interface.
 */
interface AssignmentCompletionStatusProps {
  /**
   * The submitted assignment content.
   * @type {string}
   */
  submissionContent: string;
}

/**
 * AssignmentCompletionStatus component to display the status of assignment completion.
 * @param {AssignmentCompletionStatusProps} props - The component props.
 * @returns {JSX.Element} The AssignmentCompletionStatus component.
 */
export const AssignmentCompletionStatus = ({
  submissionContent,
}: AssignmentCompletionStatusProps): JSX.Element => {
  const wordCount = submissionContent
    ? submissionContent.trim().split(/\s+/).length
    : 0;

  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ paddingTop: "40px", paddingBottom: "40px" }}
    >
      <div className="mb-6">
        <div className="flex">
          <h3 className="text-2xl font-bold mb-2">Assignment Submitted</h3>
          <IconCheck size={35} className="text-success mb-4 ml-2" />
        </div>
      </div>
      <Card className="w-full max-w-md p-4 shadow-none">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-default-600">Approximate Word Count:</span>
            <span className="font-medium">{wordCount} words</span>
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
