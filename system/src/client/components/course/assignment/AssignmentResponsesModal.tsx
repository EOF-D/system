import { TextEditor } from "@/client/components/TextEditor";
import { formatDate } from "@/client/utils/format";
import { SubmissionWithDetails } from "@/shared/types/models/submission";
import {
  Avatar,
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { useState } from "react";

/**
 * AssignmentResponsesModal props interface.
 */
interface AssignmentResponsesModalProps {
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
   * List of student submissions with details.
   * @type {SubmissionWithDetails[]}
   */
  submissions: SubmissionWithDetails[];

  /**
   * Indicates if submissions are being loaded.
   * @type {boolean}
   */
  isLoading: boolean;

  /**
   * Callback function to view a specific submission.
   * @param {number} submissionId - The ID of the submission to view.
   * @type {function}
   */
  onViewSubmission: (submissionId: number) => void;
}

/**
 * AssignmentResponsesModal component to display student assignment responses.
 * @param {AssignmentResponsesModalProps} props - The component props.
 * @returns {JSX.Element} The AssignmentResponsesModal component.
 */
export const AssignmentResponsesModal = ({
  isOpen,
  onClose,
  submissions,
  isLoading,
  onViewSubmission,
}: AssignmentResponsesModalProps): JSX.Element => {
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithDetails | null>(null);

  const handleViewSubmission = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission);
    onViewSubmission(submission.id);
  };

  const handleBackToList = () => {
    setSelectedSubmission(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        handleBackToList();
      }}
      size="4xl"
      classNames={{
        backdrop:
          "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
      }}
      radius="lg"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col justify-start gap-2">
          <h3 className="text-xl font-semibold">
            {selectedSubmission
              ? `Submission: ${selectedSubmission.student_full_name}`
              : "Student Submissions"}
          </h3>
        </ModalHeader>
        <ModalBody style={{ paddingBottom: "40px" }}>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Spinner size="lg" color="primary" />
            </div>
          ) : selectedSubmission ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                <div>
                  <h4 className="text-lg font-medium">
                    Status:{" "}
                    <Chip
                      color={
                        selectedSubmission.status === "submitted"
                          ? "success"
                          : "warning"
                      }
                      variant="flat"
                    >
                      {selectedSubmission.status.charAt(0).toUpperCase() +
                        selectedSubmission.status.slice(1)}
                    </Chip>
                  </h4>
                  <p className="text-default-500 text-sm">
                    Submitted: {formatDate(selectedSubmission.submission_date)}
                  </p>
                </div>
              </div>

              <h5 className="text-md font-medium mb-2">Submission Content</h5>
              <TextEditor
                content={
                  selectedSubmission.content || "<p>No content submitted</p>"
                }
                isReadOnly={true}
              />
            </div>
          ) : submissions.length > 0 ? (
            <Table
              removeWrapper
              aria-label="Student submissions"
              color="primary"
              selectionMode="none"
              classNames={{
                th: "bg-default-50 text-default-700",
                td: "py-3",
              }}
            >
              <TableHeader>
                <TableColumn>STUDENT</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>SUBMITTED</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="No submissions found for this assignment.">
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={submission.student_full_name}
                          size="sm"
                          color="primary"
                          isBordered
                        />
                        <span className="font-medium">
                          {submission.student_full_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={
                          submission.status === "submitted"
                            ? "success"
                            : "warning"
                        }
                        variant="flat"
                        radius="full"
                      >
                        {submission.status.charAt(0).toUpperCase() +
                          submission.status.slice(1)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-default-500">
                        {formatDate(submission.submission_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => handleViewSubmission(submission)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-default-500">No student submissions yet.</p>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
