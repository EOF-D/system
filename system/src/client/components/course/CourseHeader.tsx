import { isProfessor } from "@/client/services/authService";
import { inviteStudent } from "@/client/services/enrollmentService";
import { formatDays, formatTime } from "@/client/utils/format";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import {
  CourseWithEnrollments,
  CourseWithProfessor,
} from "@shared/types/models/course";
import {
  IconBook,
  IconCalendarTime,
  IconMapPin,
  IconPlus,
  IconUserPlus,
} from "@tabler/icons-react";
import { useState } from "react";

/**
 * CourseHeader props interface.
 */
interface CourseHeaderProps {
  /**
   * The course object containing course details.
   * @type {CourseWithEnrollments | CourseWithProfessor}
   */
  course: CourseWithEnrollments | CourseWithProfessor;

  /**
   * The total number of items in the course.
   * @type {number}
   */
  totalItems: number;

  /**
   * Callback function to be called when a material is added.
   * @type {function}
   */
  onMaterialAdd?: () => void;

  /**
   * Callback function to be called when a student is successfully invited.
   * @type {function}
   */
  onSuccessfulInvite?: () => void;
}

/**
 * CourseHeader component to display course details and actions.
 * @param {CourseHeaderProps} props - The props for the CourseHeader component.
 * @returns {JSX.Element} The CourseHeader component.
 */
export const CourseHeader = ({
  course,
  totalItems,
  onMaterialAdd,
  onSuccessfulInvite,
}: CourseHeaderProps): JSX.Element => {
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
      const response = await inviteStudent(course.id, inviteEmail);
      if (response.success) {
        setInviteEmail("");
        onInviteClose();
        if (onSuccessfulInvite) {
          onSuccessfulInvite();
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

  const isProfessorCourse = (course: any): course is CourseWithEnrollments => {
    return "enrollment_count" in course;
  };

  const isStudentCourse = (course: any): course is CourseWithProfessor => {
    return "professor_full_name" in course;
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex justify-between bg-default-100">
          <div>
            <h1 className="text-2xl font-bold">
              {course.prefix}-{course.number}: {course.name}
            </h1>
            {isStudentCourse(course) && (
              <p className="text-default-600">
                Professor: {course.professor_full_name}
              </p>
            )}
          </div>
          {isProfessor() && (
            <Dropdown>
              <DropdownTrigger>
                <Button variant="light">Actions</Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  key="invite"
                  startContent={<IconUserPlus size={16} />}
                  onPress={onInviteOpen}
                >
                  Invite Students
                </DropdownItem>
                <DropdownItem
                  key="material"
                  startContent={<IconPlus size={16} />}
                  onPress={onMaterialAdd}
                >
                  Add Material
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <IconMapPin size={18} className="text-default-500" />
              <span>Room: {course.room}</span>
            </div>
            <div className="flex items-center gap-2">
              <IconCalendarTime size={18} className="text-default-500" />
              <span>
                {formatTime(course.start_time)} - {formatTime(course.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <IconBook size={18} className="text-default-500" />
              <span>{formatDays(course.days)}</span>
            </div>
          </div>
        </CardBody>
        {isProfessorCourse(course) && (
          <>
            <Divider />
            <CardFooter>
              <div className="flex gap-4">
                <Chip color="primary" size="sm">
                  {course.enrollment_count} Students
                </Chip>
                <Chip variant="flat" size="sm">
                  {totalItems} Materials
                </Chip>
              </div>
            </CardFooter>
          </>
        )}
      </Card>

      <Modal isOpen={isInviteOpen} onClose={onInviteClose}>
        <ModalContent>
          <ModalHeader>
            Invite students to {course.prefix} {course.number}
          </ModalHeader>
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
              description="Enter the student's university email address"
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
    </>
  );
};
