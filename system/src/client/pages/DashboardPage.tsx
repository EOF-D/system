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

  const [inviteSection, setInviteSection] = useState("01");
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
      const response = await inviteStudent(
        selectedCourse.id,
        inviteEmail,
        inviteSection
      );
      if (response.success) {
        setInviteSection("01");
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
      <div style={{ paddingBottom: "20px" }}>
        <div
          className="flex justify-between items-center mb-4"
          style={{ paddingTop: "10px", paddingBottom: "10px" }}
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="bg-primary-100 text-primary-500 p-2 rounded-full mr-2">
              <IconDoorEnter size={20} />
            </span>
            Course Invitations
          </h2>
        </div>

        {isInvitationsLoading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner size="md" />
          </div>
        ) : invitations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invitations.map((invitation) => (
              <Card
                key={invitation.id}
                className="border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-default-50 to-default-100"
                radius="lg"
              >
                <CardBody>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold">
                      {invitation.course_prefix}-{invitation.course_number}-
                      {invitation.section}
                    </h3>
                    <p className="text-default-600">{invitation.course_name}</p>
                    <div className="flex items-center gap-1 text-default-500 mt-1">
                      <span>Professor:</span>
                      <span className="font-medium">
                        {invitation.professor_full_name}
                      </span>
                    </div>
                    <p className="text-sm text-default-400 mt-2">
                      Invited on {formatDate(invitation.enrollment_date)}
                    </p>
                  </div>
                </CardBody>
                <Divider />
                <CardFooter className="flex justify-between">
                  <Button
                    color="success"
                    size="sm"
                    variant="flat"
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
                    variant="flat"
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
          <Card
            radius="lg"
            className="bg-default-50 text-center p-6 mb-10 border border-default-200"
          >
            <CardBody>
              <p className="text-default-600">
                You don't have any pending invitations.
              </p>
            </CardBody>
          </Card>
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
        className="shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 bg-gradient-to-br from-default-50 to-default-100 border border-default-200"
        isPressable
        radius="lg"
        onPress={() => {
          navigate(`/courses/${course.id}`);
        }}
      >
        <CardHeader className="flex justify-between items-center pb-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-primary-500">
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
              </h3>
              {isStudentCourse(course) && (
                <Chip size="sm" variant="flat" color="primary" radius="full">
                  {course.professor_full_name}
                </Chip>
              )}
            </div>
          </div>
          {isProfessor() && (
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light" radius="full">
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
          )}
        </CardHeader>
        <Divider />
        <CardBody className="py-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-default-600">
              <IconMapPin size={16} className="text-primary-400" />
              <span>{course.room}</span>
            </div>
            <div className="flex items-center gap-2 text-default-600">
              <IconCalendarTime size={16} className="text-primary-400" />
              <span>
                {formatTime(course.start_time)} - {formatTime(course.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-default-600">
              <IconBook size={16} className="text-primary-400" />
              <span>{formatDays(course.days)}</span>
            </div>
          </div>
        </CardBody>
        <Divider />
        <CardFooter className="flex justify-between pt-2">
          {isProfessorCourse(course) ? (
            <div className="flex items-center gap-2">
              <Chip size="sm" color="primary" radius="full">
                {course.enrollment_count} Students
              </Chip>
              <Chip size="sm" variant="flat" radius="full">
                {course.assignment_count} Assignments
              </Chip>
            </div>
          ) : (
            isStudentCourse(course) &&
            "final_grade" in course &&
            typeof course.final_grade === "string" && (
              <Chip
                size="sm"
                radius="full"
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
        <div
          className="flex justify-between items-center mb-4"
          style={{ paddingTop: "10px", paddingBottom: "10px" }}
        >
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span className="bg-primary-100 text-primary-500 p-2 rounded-full mr-2">
              <IconBook size={15} />
            </span>
            {isProfessor() ? "My Courses" : "Enrolled Courses"}
          </h2>

          {isProfessor() && (
            <Button
              color="primary"
              startContent={<IconPlus size={15} />}
              onPress={onCreateOpen}
              radius="full"
            >
              Create Course
            </Button>
          )}
        </div>

        {error && (
          <Card
            className="mb-4 bg-danger-50 border-danger-200 shadow-none"
            radius="lg"
            style={{ marginBottom: "20px" }}
          >
            <CardBody>
              <p className="text-danger-500">{error}</p>
            </CardBody>
          </Card>
        )}

        {isCoursesLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" color="primary" />
          </div>
        ) : courses.length === 0 ? (
          <Card
            radius="lg"
            className="bg-default-50 text-center border border-default-200"
          >
            <CardBody>
              <p className="text-default-600 mb-4">
                {isProfessor()
                  ? "You haven't created any courses yet."
                  : "You're not enrolled in any courses yet."}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4" style={{ paddingBottom: "20px" }}>
            {courses.map(renderCourseCard)}
          </div>
        )}
      </div>
    );
  };

  const renderCreateCourseModal = () => {
    return (
      <Modal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        size="lg"
        classNames={{
          backdrop:
            "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
        }}
        className="rounded-lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl">Create new course</h3>
            <p className="text-default-500 text-sm">
              Fill in the details to create a new course
            </p>
          </ModalHeader>
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
                  variant="bordered"
                  radius="lg"
                  className="mb-2"
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
                variant="bordered"
                radius="lg"
              />
              <Input
                label="Course Number"
                placeholder="101"
                value={courseForm.number}
                onValueChange={(value) =>
                  handleCourseFormChange("number", value)
                }
                isRequired
                variant="bordered"
                radius="lg"
              />
              <Input
                label="Room"
                placeholder="JOYC-205"
                value={courseForm.room}
                onValueChange={(value) => handleCourseFormChange("room", value)}
                isRequired
                variant="bordered"
                radius="lg"
              />
              <Select
                label="Meeting Days"
                placeholder="Select meeting days"
                selectionMode="multiple"
                onChange={(e) => handleCourseFormChange("days", e.target.value)}
                isRequired
                variant="bordered"
                radius="lg"
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
                variant="bordered"
                radius="lg"
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
                variant="bordered"
                radius="lg"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onCreateClose} radius="full">
              Cancel
            </Button>
            <Button color="primary" onPress={handleCreateCourse} radius="full">
              Create Course
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
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
        className="rounded-lg"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl">
              Invite Students to {selectedCourse?.prefix}{" "}
              {selectedCourse?.number}
            </h3>
          </ModalHeader>
          <ModalBody>
            {inviteError && (
              <div className="bg-danger-50 text-danger-500 p-3 rounded-lg mb-4">
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
    );
  };

  return (
    <Layout page="Dashboard">
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-primary-100 to-default-100 p-6 rounded-xl shadow-sm mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-primary-700">
            My Dashboard
          </h1>
          <p className="text-default-600 mt-1">
            Manage your courses and invitations
          </p>
        </div>

        {renderInvitationsList()}
        {renderCoursesList()}
        {renderCreateCourseModal()}
        {renderInviteStudentModal()}
      </div>
    </Layout>
  );
}
