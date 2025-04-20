import { useAuth } from "@/client/context/auth";
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
  IconMenu2,
  IconPlus,
  IconUser,
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
  const { user } = useAuth();
  const [inviteSection, setInviteSection] = useState("01");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleInviteStudent = async () => {
    if (!inviteEmail) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      const response = await inviteStudent(
        course.id,
        inviteEmail,
        inviteSection
      );
      if (response.success) {
        setInviteEmail("");
        setInviteSection("01");
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
      <Card className="mb-6 overflow-hidden shadow-md border border-default-200">
        <CardHeader className="flex justify-between bg-opacity-80 backdrop-blur-sm bg-default-200 dark:bg-default-100">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">
              <span className="rounded-md">
                {isStudentCourse(course) ? (
                  <p>
                    {course.prefix}-{course.number}-{course.section || "01"}:{" "}
                    {course.name}
                  </p>
                ) : (
                  <p>
                    {course.prefix}-{course.number}: {course.name}
                  </p>
                )}
              </span>
            </h1>
          </div>
          {isProfessor() && (
            <Dropdown>
              <DropdownTrigger>
                <Button variant="flat" color="primary" radius="full" size="sm">
                  <IconMenu2 size={16} className="mr-2" />
                  Actions
                </Button>
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
        <CardBody className="py-3 px-1">
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-1"
            style={{ paddingLeft: "20px" }}
          >
            <div className="flex items-center gap-2 bg-opacity-60 rounded-lg shadow-sm py-2">
              <IconUser size={18} className="text-primary-500" />
              <span className="font-medium">
                Professor:{" "}
                {isStudentCourse(course)
                  ? course.professor_full_name
                  : user!.first_name + " " + user!.last_name}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-opacity-60 rounded-lg shadow-sm py-2">
              <IconMapPin size={18} className="text-primary-500" />
              <span className="font-medium">Room: {course.room}</span>
            </div>
            <div className="flex items-center gap-2 bg-opacity-60 rounded-lg shadow-sm py-2">
              <IconCalendarTime size={18} className="text-primary-500" />
              <span className="font-medium">
                {formatTime(course.start_time)} - {formatTime(course.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-opacity-60 rounded-lg shadow-sm py-2">
              <IconBook size={18} className="text-primary-500" />
              <span className="font-medium">{formatDays(course.days)}</span>
            </div>
          </div>
        </CardBody>
        {isProfessorCourse(course) && (
          <>
            <Divider />
            <CardFooter className="pt-2">
              <div className="flex gap-4">
                <Chip color="primary" size="sm" radius="full" variant="flat">
                  {course.enrollment_count} Students
                </Chip>
                <Chip variant="flat" size="sm" radius="full">
                  {totalItems} Materials
                </Chip>
              </div>
            </CardFooter>
          </>
        )}
      </Card>

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
          <ModalHeader>
            <h3 className="text-xl">
              Invite students to {course.prefix}-{course.number}
            </h3>
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
              description="Enter the student's university email address"
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
    </>
  );
};
