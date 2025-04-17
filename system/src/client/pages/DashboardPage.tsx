import { useAuth } from "@/client/context/auth";
import { Layout } from "@/client/layouts/default";
import { isProfessor } from "@/client/services/authService";
import {
  createCourse,
  deleteCourse,
  getCourses,
} from "@/client/services/courseService";
import {
  acceptInvitation,
  declineInvitation,
  getMyInvitations,
  inviteStudent,
} from "@/client/services/enrollmentService";
import {
  CourseWithEnrollments,
  CourseWithProfessor,
} from "@/shared/types/models/course";
import { EnrollmentWithCourseDetails } from "@/shared/types/models/enrollment";
import { formatDate, formatDays, formatTime } from "@client/utils/format";
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
  Select,
  SelectItem,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import {
  IconBook,
  IconCalendarTime,
  IconDoorEnter,
  IconDotsVertical,
  IconMapPin,
  IconPlus,
  IconTrash,
  IconUserPlus,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * DashboardPage component that displays the user's dashboard with courses and invitations.
 * @returns {JSX.Element} The DashboardPage component.
 */
export function DashboardPage(): JSX.Element {
  const { user, isLoggedIn } = useAuth();

  const [courses, setCourses] = useState<
    CourseWithEnrollments[] | CourseWithProfessor[]
  >([]);

  const [invitations, setInvitations] = useState<EnrollmentWithCourseDetails[]>(
    []
  );

  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [isInvitationsLoading, setIsInvitationsLoading] = useState(true);
  const [courseDeleting, setCourseDeleting] = useState<number | null>(null);
  const [invitationAction, setInvitationAction] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  const {
    isOpen: isInviteOpen,
    onOpen: onInviteOpen,
    onClose: onInviteClose,
  } = useDisclosure();

  const [courseForm, setCourseForm] = useState({
    name: "",
    prefix: "",
    number: "",
    room: "",
    start_time: "",
    end_time: "",
    days: "",
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] =
    useState<CourseWithEnrollments | null>(null);

  const dayOptions = [
    { label: "Monday", value: "M" },
    { label: "Tuesday", value: "T" },
    { label: "Wednesday", value: "W" },
    { label: "Thursday", value: "Th" },
    { label: "Friday", value: "F" },
  ];

  useEffect(() => {
    if (isLoggedIn) {
      fetchCourses();
      if (!isProfessor()) {
        fetchInvitations();
      }
    }
  }, [isLoggedIn]);

  // Fetch courses information.
  const fetchCourses = async () => {
    setIsCoursesLoading(true);
    setError(null);

    try {
      const response = await getCourses();
      if (response.success && response.data) {
        setCourses(
          response.data as CourseWithEnrollments[] | CourseWithProfessor[]
        );
      } else {
        setError(response.message || "Failed to fetch courses");
      }
    } catch (error) {
      console.error(`Error fetching courses: ${error}`);
      setError("Network error. Please try again later.");
    } finally {
      setIsCoursesLoading(false);
    }
  };

  // Fetch invitations information.
  const fetchInvitations = async () => {
    if (isProfessor()) return;

    setIsInvitationsLoading(true);

    try {
      const response = await getMyInvitations();
      if (response.success && response.data) {
        setInvitations(response.data as EnrollmentWithCourseDetails[]);
      } else {
        console.error(`Error fetching invitations: ${response.message}`);
      }
    } catch (error) {
      console.error(`Error fetching invitations: ${error}`);
    } finally {
      setIsInvitationsLoading(false);
    }
  };

  const handleCourseFormChange = (field: string, value: string) => {
    setCourseForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetCourseForm = () => {
    setCourseForm({
      name: "",
      prefix: "",
      number: "",
      room: "",
      start_time: "",
      end_time: "",
      days: "",
    });
  };

  // Create a new course.
  const handleCreateCourse = async () => {
    if (!user) {
      setError("User not logged in");
      return;
    }

    if (user.role !== "professor") {
      setError("Only professors can create courses");
      return;
    }

    try {
      const response = await createCourse({
        ...courseForm,
        professor_id: user.id,
      });
      if (response.success) {
        fetchCourses();
        onCreateClose();
        resetCourseForm();
      } else {
        setError(response.message || "Failed to create course");
      }
    } catch (error) {
      console.error(`Error creating course: ${error}`);
      setError("Network error. Please try again later.");
    }
  };

  // Invite a student to a course.
  const handleInviteStudent = async () => {
    if (!selectedCourse || !inviteEmail) return;

    setInviteLoading(true);
    setInviteError(null);

    try {
      const response = await inviteStudent(selectedCourse.id, inviteEmail);
      if (response.success) {
        setInviteEmail("");
        onInviteClose();
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

  // Accept or decline an invitation.
  const handleAcceptInvitation = async (invitationId: number) => {
    setInvitationAction(invitationId);
    try {
      const response = await acceptInvitation(invitationId);
      if (response.success) {
        fetchInvitations();
        fetchCourses();
      } else {
        alert("Failed to accept invitation: " + response.message);
      }
    } catch (error) {
      console.error(`Error accepting invitation: ${error}`);
      alert("Network error. Please try again later.");
    } finally {
      setInvitationAction(null);
    }
  };

  const handleDeclineInvitation = async (invitationId: number) => {
    setInvitationAction(invitationId);
    try {
      const response = await declineInvitation(invitationId);
      if (response.success) {
        fetchInvitations();
      } else {
        alert("Failed to decline invitation: " + response.message);
      }
    } catch (error) {
      console.error(`Error declining invitation: ${error}`);
      alert("Network error. Please try again later.");
    } finally {
      setInvitationAction(null);
    }
  };

  // Delete a course.
  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm("Are you sure you want to delete this course?")) {
      return;
    }

    setCourseDeleting(courseId);
    try {
      const response = await deleteCourse(courseId);
      if (response.success) {
        fetchCourses();
      } else {
        alert("Failed to delete course: " + response.message);
      }
    } catch (error) {
      console.error(`Error deleting course: ${error}`);
      alert("Network error. Please try again later.");
    } finally {
      setCourseDeleting(null);
    }
  };

  const handleOpenInviteModal = (course: CourseWithEnrollments) => {
    setSelectedCourse(course);
    setInviteEmail("");
    setInviteError(null);
    onInviteOpen();
  };

  const isProfessorCourse = (course: any): course is CourseWithEnrollments => {
    return "enrollment_count" in course;
  };

  const isStudentCourse = (course: any): course is CourseWithProfessor => {
    return "professor_full_name" in course;
  };

  if (!isLoggedIn || !user) {
    return (
      <Layout page="Dashboard">
        <div className="flex justify-center items-center w-full h-64">
          <p className="text-sm text-default-500">
            Please log in to view your dashboard.
          </p>
        </div>
      </Layout>
    );
  }

  const renderInvitationsList = () => {
    if (isProfessor()) return null;

    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Course Invitations</h2>

        {isInvitationsLoading ? (
          <div className="flex justify-center items-center h-40">
            <Spinner size="md" />
          </div>
        ) : invitations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="border border-default-200">
                <CardBody>
                  <p>
                    <span className="font-medium">Professor:</span>{" "}
                    {invitation.professor_full_name}
                  </p>
                  <p className="text-sm text-default-500 mt-2">
                    Invited on {formatDate(invitation.enrollment_date)}
                  </p>
                </CardBody>
                <Divider />
                <CardFooter className="flex justify-between">
                  <Button
                    color="success"
                    size="sm"
                    variant="light"
                    startContent={<IconDoorEnter size={16} />}
                    onPress={() => handleAcceptInvitation(invitation.id)}
                    isLoading={invitationAction === invitation.id}
                    isDisabled={invitationAction !== null}
                  >
                    Accept
                  </Button>
                  <Button
                    color="danger"
                    size="sm"
                    variant="light"
                    onPress={() => handleDeclineInvitation(invitation.id)}
                    isLoading={invitationAction === invitation.id}
                    isDisabled={invitationAction !== null}
                  >
                    Decline
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-default-100 rounded-lg p-6 text-center mb-10">
            <p className="text-default-600">
              You don't have any pending invitations.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderCourseCard = (
    course: CourseWithEnrollments | CourseWithProfessor
  ) => {
    return (
      <Card
        key={course.id}
        className="border border-default-200 hover:shadow-md transition-shadow"
        isPressable
        onPress={() => {
          navigate(`/courses/${course.id}`);
        }}
      >
        <CardHeader className="flex justify-between items-center bg-default-100">
          <h3 className="text-lg font-semibold justify-start">
            {course.prefix}-{course.number}
          </h3>
          <p className="text-sm text-default-500">{course.name}</p>
          {isProfessor() ? (
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <IconDotsVertical size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Course actions">
                <DropdownItem
                  key="invite"
                  startContent={<IconUserPlus size={16} />}
                  onPress={() =>
                    handleOpenInviteModal(course as CourseWithEnrollments)
                  }
                >
                  Invite Students
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<IconTrash size={16} />}
                  onPress={() => handleDeleteCourse(course.id)}
                >
                  {courseDeleting === course.id
                    ? "Deleting..."
                    : "Delete Course"}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            isStudentCourse(course) && (
              <Chip size="sm" variant="flat">
                {course.professor_full_name}
              </Chip>
            )
          )}
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <IconMapPin size={16} className="text-default-500" />
              <span>{course.room}</span>
            </div>
            <div className="flex items-center gap-2">
              <IconCalendarTime size={16} className="text-default-500" />
              <span>
                {formatTime(course.start_time)} - {formatTime(course.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <IconBook size={16} className="text-default-500" />
              <span>{formatDays(course.days)}</span>
            </div>
          </div>
        </CardBody>
        <Divider />
        <CardFooter className="flex justify-between">
          {isProfessorCourse(course) ? (
            <div className="flex items-center gap-2">
              <Chip size="sm" color="primary">
                {course.enrollment_count} Students
              </Chip>
              <Chip size="sm" variant="flat">
                {course.assignment_count} Assignments
              </Chip>
            </div>
          ) : (
            isStudentCourse(course) &&
            "final_grade" in course &&
            typeof course.final_grade === "string" && (
              <Chip
                size="sm"
                color={
                  course.final_grade.startsWith("A")
                    ? "success"
                    : course.final_grade.startsWith("B")
                      ? "primary"
                      : course.final_grade.startsWith("C")
                        ? "warning"
                        : "danger"
                }
              >
                Grade: {course.final_grade}
              </Chip>
            )
          )}
        </CardFooter>
      </Card>
    );
  };

  const renderCoursesList = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isProfessor() ? "My Courses" : "Enrolled Courses"}
          </h2>

          {isProfessor() && (
            <Button
              color="primary"
              startContent={<IconPlus size={18} />}
              onPress={onCreateOpen}
            >
              Create Course
            </Button>
          )}
        </div>

        {isCoursesLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="md" />
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-default-100 rounded-lg p-8 text-center">
            <p className="text-default-600 mb-4">
              {isProfessor()
                ? "You haven't created any courses yet."
                : "You're not enrolled in any courses yet."}
            </p>
            {isProfessor() && (
              <Button
                color="primary"
                startContent={<IconPlus size={18} />}
                onPress={onCreateOpen}
              >
                Create your first course
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(renderCourseCard)}
          </div>
        )}
      </div>
    );
  };

  const renderCreateCourseModal = () => {
    return (
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalContent>
          <ModalHeader>Create new course</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Course Name"
                  placeholder="Introduction to Computer Science"
                  value={courseForm.name}
                  onValueChange={(value) =>
                    handleCourseFormChange("name", value)
                  }
                  isRequired
                />
              </div>
              <Input
                label="Department Prefix"
                placeholder="CSI"
                value={courseForm.prefix}
                onValueChange={(value) =>
                  handleCourseFormChange("prefix", value)
                }
                isRequired
              />
              <Input
                label="Course Number"
                placeholder="101"
                value={courseForm.number}
                onValueChange={(value) =>
                  handleCourseFormChange("number", value)
                }
                isRequired
              />
              <Input
                label="Room"
                placeholder="JOYC-205"
                value={courseForm.room}
                onValueChange={(value) => handleCourseFormChange("room", value)}
                isRequired
              />
              <Select
                label="Meeting Days"
                placeholder="Select meeting days"
                selectionMode="multiple"
                onChange={(e) => handleCourseFormChange("days", e.target.value)}
                isRequired
              >
                {dayOptions.map((day) => (
                  <SelectItem key={day.value}>{day.label}</SelectItem>
                ))}
              </Select>
              <Input
                label="Start Time"
                placeholder="09:00"
                type="time"
                value={courseForm.start_time}
                onValueChange={(value) =>
                  handleCourseFormChange("start_time", value)
                }
                isRequired
              />
              <Input
                label="End Time"
                placeholder="10:50"
                type="time"
                value={courseForm.end_time}
                onValueChange={(value) =>
                  handleCourseFormChange("end_time", value)
                }
                isRequired
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={onCreateClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleCreateCourse}>
              Create Course
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  const renderInviteStudentModal = () => {
    return (
      <Modal isOpen={isInviteOpen} onClose={onInviteClose}>
        <ModalContent>
          <ModalHeader>
            Invite Students to {selectedCourse?.prefix} {selectedCourse?.number}
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
    );
  };

  return (
    <Layout page="Dashboard">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>

        {error && (
          <div className="bg-danger-100 text-danger-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {renderInvitationsList()}
        {renderCoursesList()}
        {renderCreateCourseModal()}
        {renderInviteStudentModal()}
      </div>
    </Layout>
  );
}
