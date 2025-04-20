import { TextEditor } from "@/client/components/TextEditor";
import { isProfessor } from "@/client/services/authService";
import {
  getCourseItemById,
  updateCourseItem,
} from "@/client/services/courseItemService";
import { CourseItem } from "@/shared/types/models/courseItem";
import { Button, Spinner } from "@heroui/react";
import { IconCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * DocumentContent props interface.
 */
interface DocumentContentProps {
  /**
   * The course item object containing document details.
   * @type {CourseItem}
   */
  courseItem: CourseItem;

  /**
   * The ID of the course.
   * @type {number}
   */
  courseId: number;

  /**
   * Callback function to be called when the document is refreshed.
   * @type {function}
   */
  onRefresh?: () => void;
}

/**
 * DocumentContent component to display document content.
 * @param {DocumentContentProps} props - The props for the DocumentContent component.
 * @returns {JSX.Element} The DocumentContent component.
 */
export const DocumentContent = ({
  courseItem,
  courseId,
  onRefresh,
}: DocumentContentProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [documentContent, setDocumentContent] = useState(
    courseItem.description || ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfessorMode] = useState(isProfessor());

  useEffect(() => {
    setDocumentContent(courseItem.description || "");
  }, [courseItem]);

  // Update the content of the document.
  const handleUpdateDocument = async () => {
    if (!isProfessorMode) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await updateCourseItem(courseId, courseItem.id, {
        description: documentContent,
      });

      if (response.success) {
        setIsEditing(false);
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setError(response.message || "Failed to update document");
      }
    } catch (error) {
      console.error(`Error updating document: ${error}`);
      setError(
        "An error occurred while updating the document. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch the latest document content.
  const fetchDocumentContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getCourseItemById(courseId, courseItem.id);

      if (response.success && response.data) {
        if (!Array.isArray(response.data)) {
          setDocumentContent(response.data.description || "");
        } else {
          setError("Unexpected data format received.");
        }
      } else {
        setError(response.message || "Failed to load document content");
      }
    } catch (error) {
      console.error(`Error fetching document content: ${error}`);
      setError(
        "An error occurred while loading the document. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-danger mb-4">{error}</p>
        <Button color="primary" variant="flat" onPress={fetchDocumentContent}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4" style={{ padding: "20px" }}>
      <div className="flex justify-between" style={{ marginBottom: "5px" }}>
        <h2 className="text-xl font-semibold">Document</h2>
        {isProfessorMode && !isEditing && (
          <Button
            size="sm"
            color="primary"
            variant="flat"
            onPress={() => setIsEditing(true)}
          >
            Edit Document
          </Button>
        )}
        {isProfessorMode && isEditing && (
          <div className="flex gap-2">
            <Button
              size="sm"
              color="danger"
              variant="flat"
              onPress={() => {
                setIsEditing(false);
                setDocumentContent(courseItem.description || "");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              color="success"
              onPress={handleUpdateDocument}
              isLoading={isSubmitting}
              endContent={<IconCheck size={16} />}
            >
              Save
            </Button>
          </div>
        )}
      </div>
      <TextEditor
        content={documentContent}
        isReadOnly={!isProfessorMode || !isEditing}
        onChangeContent={
          isProfessorMode && isEditing ? setDocumentContent : undefined
        }
      />
    </div>
  );
};
