import { formatDate } from "@/client/utils/format";
import { inviteStudent } from "@/client/services/enrollmentService";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from "@heroui/react";
import { IconUserPlus } from "@tabler/icons-react";
import { useState } from "react";
import { EnrollmentWithStudentDetails } from "@/shared/types/models/enrollment";

/**
 * CourseStudents props interface.
 */
interface CourseStudentsProps {
  /**
   * The ID of the course.
   * @type {number}
   */
  courseId: number;

  /**
   * List of student enrollments.
   * @type {EnrollmentWithStudentDetails[]}
   */
  enrollments: EnrollmentWithStudentDetails[];

  /**
   * Callback function when a student is successfully invited.
   * @type {function}
   */
  onInviteSuccess?: () => void;
}

/**
 * Component to display and manage students enrolled in a course.
 * @return {JSX.Element} CourseStudents component.
 */
export const CourseStudents = ({
  courseId,
  enrollments,
  onInviteSuccess,
}: CourseStudentsProps): JSX.Element => {
  const {
    isOpen: isInviteOpen,
    onOpen: onInviteOpen,
    onClose: onInviteClose,
  } = useDisclosure();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleInviteStudent = async () => {
    if (!inviteEmail) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      const response = await inviteStudent(courseId, inviteEmail);
      if (response.success) {
        setInviteEmail("");
        onInviteClose();
        if (onInviteSuccess) {
          onInviteSuccess();
        }
      } else {
        setInviteError(response.message || "Failed to send invitation");
      }
    } catch (error) {
      console.error(`Error inviting student: ${error}`);
      setInviteError("Network error. Please try again later.");
    } finally {
      setInviteLoading(false);
    }
  };

  const renderInviteStudentModal = () => {
    return (
      <Modal isOpen={isInviteOpen} onClose={onInviteClose}>
        <ModalContent>
          <ModalHeader>Invite students to this course</ModalHeader>
          <ModalBody>
            {inviteError && (
              <div className="bg-danger-100 text-danger-700 p-3 rounded-lg mb-4">
                {inviteError}
              </div>
            )}
            <Input
              label="Student Email"
              placeholder="first.last@mymail.champlain.edu"
              value={inviteEmail}
              onValueChange={setInviteEmail}
              type="email"
              isRequired
              description="Enter the student's email address"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={onInviteClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleInviteStudent}
              isLoading={inviteLoading}
              isDisabled={!inviteEmail || inviteLoading}
            >
              Send Invitation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Enrolled Students</h2>
        <Button
          color="primary"
          variant="light"
          startContent={<IconUserPlus size={18} />}
          onPress={onInviteOpen}
        >
          Invite Student
        </Button>
      </div>

      <Card>
        <Table aria-label="Enrolled students">
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn>EMAIL</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>JOINED</TableColumn>
          </TableHeader>
          <TableBody>
            {enrollments.length > 0 ? (
              enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar name={enrollment.student_full_name} size="sm" />
                      <span>{enrollment.student_full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{enrollment.student_email}</TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={
                        enrollment.status === "active" ? "success" : "default"
                      }
                    >
                      {enrollment.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {formatDate(enrollment.enrollment_date)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="text-center py-4 text-default-500">
                    No students enrolled yet
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {renderInviteStudentModal()}
    </div>
  );
};
