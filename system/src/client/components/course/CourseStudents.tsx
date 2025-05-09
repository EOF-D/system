import { inviteStudent } from "@/client/services/enrollmentService";
import { formatDate } from "@/client/utils/format";
import { EnrollmentWithStudentDetails } from "@/shared/types/models/enrollment";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Divider,
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
  const [inviteSection, setInviteSection] = useState("01");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleInviteStudent = async () => {
    if (!inviteEmail) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      const response = await inviteStudent(
        courseId,
        inviteEmail,
        inviteSection
      );
      if (response.success) {
        setInviteSection("01");
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
      <Modal
        isOpen={isInviteOpen}
        onClose={onInviteClose}
        classNames={{
          backdrop:
            "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
        }}
        radius="lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl">Invite Students to this Course</h3>
            <p className="text-sm text-default-500">
              Send an invitation to join this course
            </p>
          </ModalHeader>
          <ModalBody>
            {inviteError && (
              <div className="bg-danger-50 text-danger-700 p-3 rounded-lg mb-4">
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
              variant="bordered"
              radius="lg"
            />
            <Input
              label="Section"
              placeholder="01"
              value={inviteSection}
              onValueChange={setInviteSection}
              isRequired
              description="Enter the section number (e.g., 01, 02)"
              variant="bordered"
              radius="lg"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onInviteClose} radius="full">
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleInviteStudent}
              isLoading={inviteLoading}
              isDisabled={!inviteEmail || inviteLoading}
              radius="full"
            >
              Send Invitation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  return (
    <div className="mb-6 mt-6">
      <div
        className="flex justify-between items-center mb-4"
        style={{ padding: "20px" }}
      >
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span className="bg-primary-100 text-primary-500 p-2 rounded-full mr-2">
            <IconUserPlus size={20} />
          </span>
          Enrolled Students
        </h2>
        <Button
          color="primary"
          variant="flat"
          startContent={<IconUserPlus size={18} />}
          onPress={onInviteOpen}
          radius="full"
        >
          Invite Student
        </Button>
      </div>
      <Divider />

      <Card className="shadow-sm border-none overflow-hidden" radius="lg">
        {enrollments.length > 0 ? (
          <Table
            aria-label="Enrolled students"
            color="primary"
            selectionMode="none"
            classNames={{
              th: "bg-default-50 text-default-700",
              td: "py-3",
            }}
          >
            <TableHeader>
              <TableColumn>NAME</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>SECTION</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>JOINED</TableColumn>
            </TableHeader>
            <TableBody emptyContent="No students enrolled yet">
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={enrollment.student_full_name}
                        size="sm"
                        color="primary"
                        isBordered
                      />
                      <span className="font-medium">
                        {enrollment.student_full_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-default-600">
                    {enrollment.student_email}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color="primary"
                      variant="flat"
                      radius="full"
                    >
                      {enrollment.section || "01"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={
                        enrollment.status === "active" ? "success" : "default"
                      }
                      variant="flat"
                      radius="full"
                    >
                      {enrollment.status.charAt(0).toUpperCase() +
                        enrollment.status.slice(1)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-default-500">
                      {formatDate(enrollment.enrollment_date)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center h-40">
            <p className="text-default-600">
              No students have been enrolled yet.
            </p>
          </div>
        )}
        <Divider style={{ marginBottom: "25px" }} />
      </Card>

      {renderInviteStudentModal()}
    </div>
  );
};
