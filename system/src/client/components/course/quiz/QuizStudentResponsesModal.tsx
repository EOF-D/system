import { StudentResponse } from "@/client/hooks/useQuizSubmission";
import {
  Avatar,
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";

/**
 * QuizStudentResponsesModal props interface.
 */
interface QuizStudentResponsesModalProps {
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
   * Array of student submissions to be displayed.
   * @type {StudentResponse[]}
   */
  studentSubmissions: StudentResponse[];

  /**
   * Callback function to view a specific student's submission.
   * @param {string} studentId - The ID of the student.
   * @type {function}
   */
  onViewSubmission: (studentId: string) => void;
}

/**
 * QuizStudentResponsesModal component to display student responses for a quiz.
 * @param {QuizStudentResponsesModalProps} props - The component props.
 * @returns {JSX.Element} The QuizStudentResponsesModal component.
 */
export const QuizStudentResponsesModal = ({
  isOpen,
  onClose,
  studentSubmissions,
  onViewSubmission,
}: QuizStudentResponsesModalProps): JSX.Element => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      classNames={{
        backdrop:
          "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
      }}
      radius="lg"
    >
      <ModalContent>
        <ModalHeader className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Student Responses</h3>
        </ModalHeader>
        <ModalBody style={{ paddingBottom: "40px" }}>
          <div className="flex flex-col gap-4">
            {studentSubmissions.length === 0 ? (
              <p className="text-default-500 text-center py-4">
                No submissions found for this quiz.
              </p>
            ) : (
              <>
                <Table removeWrapper aria-label="Student submissions">
                  <TableHeader>
                    <TableColumn>STUDENT</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>SCORE</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {studentSubmissions.map((submission) => (
                      <TableRow key={submission.submissionId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={submission.studentName}
                              size="sm"
                              color="primary"
                              isBordered
                            />
                            <span className="font-medium">
                              {submission.studentName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={submission.completed ? "success" : "warning"}
                            variant="flat"
                            size="sm"
                          >
                            {submission.completed ? "Completed" : "In Progress"}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {submission.completed
                            ? submission.score !== undefined
                              ? `${submission.score}%`
                              : "Not graded"
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            onPress={() => {
                              onViewSubmission(submission.studentId.toString());
                              onClose();
                            }}
                            isDisabled={!submission.completed}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
