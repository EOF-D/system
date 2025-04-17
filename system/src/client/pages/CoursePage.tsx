import { CourseHeader } from "@/client/components/course/CourseHeader";
import { CourseMaterials } from "@/client/components/course/CourseMaterials";
import { CourseStudents } from "@/client/components/course/CourseStudents";
import { useAuth } from "@/client/context/auth";
import { Layout } from "@/client/layouts/default";
import { isProfessor } from "@/client/services/authService";
import { getCourseItems } from "@/client/services/courseItemService";
import { getCourseById } from "@/client/services/courseService";
import { getCourseEnrollments } from "@/client/services/enrollmentService";
import {
  CourseWithEnrollments,
  CourseWithProfessor,
} from "@/shared/types/models/course";
import { CourseItem } from "@/shared/types/models/courseItem";
import { Button, Spinner, Tab, Tabs, useDisclosure } from "@heroui/react";
import { IconFileText, IconUsers } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

/**
 * CoursePage component to display course details and materials.
 * @returns {JSX.Element} The CoursePage component.
 */
export function CoursePage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id!);
  const { user, isLoggedIn } = useAuth();

  const [course, setCourse] = useState<
    CourseWithEnrollments | CourseWithProfessor | null
  >(null);

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courseItems, setCourseItems] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isItemsLoading, setIsItemsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const materialDisclosure = useDisclosure();

  useEffect(() => {
    if (isLoggedIn && courseId) {
      fetchCourseData();
    }
  }, [isLoggedIn, courseId]);

  const fetchCourseData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getCourseById(courseId);
      if (response.success && response.data) {
        setCourse(response.data as CourseWithEnrollments | CourseWithProfessor);

        // If professor, fetch enrolled students.
        if (isProfessor()) {
          await fetchEnrollments();
        }

        // Fetch course items.
        await fetchCourseItems();
      } else {
        setError(response.message || "Failed to fetch course details");
      }
    } catch (error) {
      console.error(`Error fetching course data: ${error}`);
      setError("Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const response = await getCourseEnrollments(courseId);
      if (response.success && response.data) {
        setEnrollments(
          Array.isArray(response.data) ? response.data : [response.data]
        );
      } else {
        console.error(`Error fetching enrollments: ${response.message}`);
      }
    } catch (error) {
      console.error(`Error fetching enrollments: ${error}`);
    }
  };

  const fetchCourseItems = async () => {
    setIsItemsLoading(true);
    try {
      const response = await getCourseItems(courseId);
      if (response.success && response.data) {
        setCourseItems(response.data as CourseItem[]);
      } else {
        console.error(`Error fetching course items: ${response.message}`);
      }
    } catch (error) {
      console.error(`Error fetching course items: ${error}`);
    } finally {
      setIsItemsLoading(false);
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <Layout page="Course">
        <div className="flex justify-center items-center w-full h-64">
          <p className="text-sm text-default-500">
            Please log in to view course details.
          </p>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout page="Course">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !course) {
    return (
      <Layout page="Course">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col justify-center items-center h-64">
            <p className="text-danger font-semibold text-lg mb-2">
              {error || "Course not found"}
            </p>
            <Button color="primary" href="/dashboard">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout page="Course">
      <div className="container mx-auto px-4 py-6">
        <CourseHeader
          course={course}
          totalItems={courseItems.length}
          onSuccessfulInvite={fetchEnrollments}
          onMaterialAdd={materialDisclosure.onOpen}
        />

        <Tabs aria-label="Course sections">
          <Tab
            key="materials"
            title={
              <div className="flex items-center gap-2">
                <IconFileText size={18} />
                <span>Materials</span>
              </div>
            }
          >
            <CourseMaterials
              courseId={courseId}
              courseItems={courseItems}
              isLoading={isItemsLoading}
              onItemsChange={fetchCourseItems}
              modalDisclosure={materialDisclosure}
            />
          </Tab>

          {isProfessor() && (
            <Tab
              key="students"
              title={
                <div className="flex items-center gap-2">
                  <IconUsers size={18} />
                  <span>Students</span>
                </div>
              }
            >
              <CourseStudents
                courseId={courseId}
                enrollments={enrollments}
                onInviteSuccess={fetchEnrollments}
              />
            </Tab>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
