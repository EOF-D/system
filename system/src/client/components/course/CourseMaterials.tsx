import { QuizContent } from "@/client/components/course/quiz/QuizContent";
import { useAuth } from "@/client/context/auth";
import { isProfessor } from "@/client/services/authService";
import {
  createCourseItem,
  deleteCourseItem,
  getCourseItemById,
  updateCourseItem,
} from "@/client/services/courseItemService";
import { getMyEnrollments } from "@/client/services/enrollmentService";
import { formatDueDate } from "@/client/utils/format";
import { CourseItem } from "@/shared/types/models/courseItem";
import { Enrollment } from "@/shared/types/models/enrollment";
import {
  Button,
  Card,
  CardBody,
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
  Textarea,
  useDisclosure,
} from "@heroui/react";
import {
  IconBook,
  IconCertificate,
  IconDotsVertical,
  IconFileText,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * CourseMaterials props interface.
 */
interface CourseMaterialsProps {
  /**
   * The ID of the course.
   * @type {number}
   */
  courseId: number;

  /**
   * List of course items.
   * @type {CourseItem[]}
   */
  courseItems: CourseItem[];

  /**
   * Loading state for course items.
   * @type {boolean}
   */
  isLoading: boolean;

  /**
   * Callback function to be called when items change.
   * @type {function}
   */
  onItemsChange: () => void;

  /**
   * Optional modal disclosure object for managing modal state.
   * @type {object}
   */
  modalDisclosure?: {
    /**
     * Function to open the modal.
     * @type {function}
     */
    isOpen: boolean;

    /**
     * Function to close the modal.
     * @type {function}
     */
    onOpen: () => void;

    /**
     * Function to close the modal.
     * @type {function}
     */
    onClose: () => void;
  };
}

/**
 * CourseMaterials component to display and manage course materials.
 * @param {CourseMaterialsProps} props - The component props.
 * @returns {JSX.Element} The CourseMaterials component.
 */
export const CourseMaterials = ({
  courseId,
  courseItems,
  isLoading,
  onItemsChange,
  modalDisclosure,
}: CourseMaterialsProps): JSX.Element => {
  const { user } = useAuth();
  const [isProfessorMode] = useState(isProfessor());
  const localAddDisclosure = useDisclosure();
  const addDisclosure = modalDisclosure || localAddDisclosure;
  const editDisclosure = useDisclosure();
  const itemViewDisclosure = useDisclosure();

  const [materialForm, setMaterialForm] = useState({
    id: 0,
    name: "",
    description: "",
    type: "document" as "document" | "assignment" | "quiz",
    due_date: "",
    max_points: 0,
  });

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<CourseItem | null>(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);

  const resetMaterialForm = () => {
    setMaterialForm({
      id: 0,
      name: "",
      description: "",
      type: "document",
      due_date: getTomorrowDate(),
      max_points: 0,
    });
  };

  // Get tomorrow's date formatted for the input.
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0] + "T23:59";
  };

  useEffect(() => {
    resetMaterialForm();
  }, []);

  const fetchCourseItem = async (itemId: number) => {
    setItemLoading(true);
    setItemError(null);

    try {
      const response = await getCourseItemById(courseId, itemId);

      if (response.success) {
        setSelectedItem(response.data as CourseItem);

        // Now fetch enrollment if student.
        if (!isProfessorMode && user) {
          fetchEnrollment();
        }
      } else {
        setItemError(response.message || "Failed to load course item");
      }
    } catch (error) {
      console.error(`Error fetching course item: ${error}`);
      setItemError("Failed to load course item. Please try again.");
    } finally {
      setItemLoading(false);
    }
  };

  const fetchEnrollment = async () => {
    // Skip for professors.
    if (!user || isProfessorMode) return;

    try {
      const response = await getMyEnrollments();

      if (response.success && Array.isArray(response.data)) {
        const userEnrollment = response.data.find(
          (e) => e.student_id === user.id && e.course_id === courseId
        );

        if (userEnrollment) {
          setEnrollment(userEnrollment);
        }
      }
    } catch (error) {
      console.error(`Error fetching enrollment: ${error}`);
    }
  };

  const handleAddMaterial = async () => {
    try {
      const itemData = {
        course_id: courseId,
        name: materialForm.name,
        type: materialForm.type,
        max_points:
          materialForm.type === "document" ? 0 : materialForm.max_points,
        due_date: materialForm.due_date,
        description: materialForm.description,
      };

      const response = await createCourseItem(courseId, itemData);
      if (response.success) {
        onItemsChange();
        resetMaterialForm();
        addDisclosure.onClose();
      } else {
        console.error(`Error adding material: ${response.message}`);
      }
    } catch (error) {
      console.error(`Error adding material: ${error}`);
    }
  };

  const handleUpdateMaterial = async () => {
    try {
      const itemData = {
        name: materialForm.name,
        type: materialForm.type,
        max_points:
          materialForm.type === "document" ? 0 : materialForm.max_points,
        due_date: materialForm.due_date,
        description: materialForm.description,
      };

      const response = await updateCourseItem(
        courseId,
        materialForm.id,
        itemData
      );
      if (response.success) {
        onItemsChange();
        resetMaterialForm();
        editDisclosure.onClose();
      } else {
        console.error(`Error updating material: ${response.message}`);
      }
    } catch (error) {
      console.error(`Error updating material: ${error}`);
    }
  };

  const handleDeleteMaterial = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      const response = await deleteCourseItem(courseId, itemId);
      if (response.success) {
        onItemsChange();
      } else {
        console.error(`Error deleting material: ${response.message}`);
      }
    } catch (error) {
      console.error(`Error deleting material: ${error}`);
    }
  };

  const handleEditMaterial = (item: CourseItem) => {
    setMaterialForm({
      id: item.id,
      name: item.name,
      description: item.description || "",
      type: item.type,
      due_date: item.due_date.split(".")[0], // Format for input.
      max_points: item.max_points,
    });
    editDisclosure.onOpen();
  };

  const handleViewMaterial = (itemId: number) => {
    setSelectedItemId(itemId);
    fetchCourseItem(itemId);
    itemViewDisclosure.onOpen();
  };

  const handleCloseItemView = () => {
    setSelectedItemId(null);
    setSelectedItem(null);
    itemViewDisclosure.onClose();
  };

  const handleRefresh = () => {
    if (selectedItemId) {
      fetchCourseItem(selectedItemId);
    }
    onItemsChange();
  };

  const renderMaterialIcon = (type: string) => {
    switch (type) {
      case "document":
        return <IconFileText size={20} />;
      case "assignment":
        return <IconBook size={20} />;
      case "quiz":
        return <IconCertificate size={20} />;
      default:
        return <IconFileText size={20} />;
    }
  };

  const getMaterialChipColor = (type: string) => {
    switch (type) {
      case "document":
        return "default";
      case "assignment":
        return "primary";
      case "quiz":
        return "secondary";
      default:
        return "default";
    }
  };

  const renderAddMaterialModal = () => {
    return (
      <Modal
        isOpen={addDisclosure.isOpen}
        onClose={addDisclosure.onClose}
        size="lg"
        classNames={{
          backdrop:
            "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
        }}
        radius="lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl">Add Course Material</h3>
            <p className="text-sm text-default-500">
              Add a new document, assignment, or quiz
            </p>
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Title"
                placeholder="Week 1 Lecture Notes"
                value={materialForm.name}
                onValueChange={(value) =>
                  setMaterialForm({ ...materialForm, name: value })
                }
                isRequired
                variant="bordered"
                radius="lg"
              />
              <Textarea
                isRequired
                label="Description"
                placeholder="Brief description of the material"
                value={materialForm.description}
                onValueChange={(value) =>
                  setMaterialForm({ ...materialForm, description: value })
                }
                variant="bordered"
                radius="lg"
                minRows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Material Type"
                  placeholder="Document"
                  value={materialForm.type}
                  onChange={(e) =>
                    setMaterialForm({
                      ...materialForm,
                      type: e.target.value as
                        | "document"
                        | "assignment"
                        | "quiz",
                    })
                  }
                  variant="bordered"
                >
                  <SelectItem key="document">Document</SelectItem>
                  <SelectItem key="assignment">Assignment</SelectItem>
                  <SelectItem key="quiz">Quiz</SelectItem>
                </Select>

                {materialForm.type !== "document" && (
                  <Input
                    type="number"
                    label="Points"
                    min={0}
                    placeholder="100"
                    value={materialForm.max_points.toString()}
                    onValueChange={(value) =>
                      setMaterialForm({
                        ...materialForm,
                        max_points: parseInt(value) || 0,
                      })
                    }
                    variant="bordered"
                    radius="lg"
                  />
                )}
              </div>
              <Input
                type="datetime-local"
                label="Due Date"
                value={materialForm.due_date}
                onValueChange={(value) =>
                  setMaterialForm({ ...materialForm, due_date: value })
                }
                isRequired
                variant="bordered"
                radius="lg"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={addDisclosure.onClose}
              radius="full"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAddMaterial}
              isDisabled={!materialForm.name || !materialForm.due_date}
              radius="full"
            >
              Add Material
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  const renderEditMaterialModal = () => {
    return (
      <Modal
        isOpen={editDisclosure.isOpen}
        onClose={editDisclosure.onClose}
        size="lg"
        classNames={{
          backdrop:
            "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
        }}
        radius="lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl">Edit Course Material</h3>
            <p className="text-sm text-default-500">Update material details</p>
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Title"
                placeholder="Week 1 Lecture Notes"
                value={materialForm.name}
                onValueChange={(value) =>
                  setMaterialForm({ ...materialForm, name: value })
                }
                isRequired
                variant="bordered"
                radius="lg"
                className="mb-2"
              />
              <Textarea
                label="Description"
                placeholder="Brief description of the material"
                value={materialForm.description}
                onValueChange={(value) =>
                  setMaterialForm({ ...materialForm, description: value })
                }
                variant="bordered"
                radius="lg"
                minRows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="border rounded-lg p-2"
                  value={materialForm.type}
                  onChange={(e) =>
                    setMaterialForm({
                      ...materialForm,
                      type: e.target.value as
                        | "document"
                        | "assignment"
                        | "quiz",
                    })
                  }
                >
                  <option value="document">Document</option>
                  <option value="assignment">Assignment</option>
                  <option value="quiz">Quiz</option>
                </select>
                {materialForm.type !== "document" && (
                  <Input
                    type="number"
                    label="Points"
                    min={0}
                    placeholder="100"
                    value={materialForm.max_points.toString()}
                    onValueChange={(value) =>
                      setMaterialForm({
                        ...materialForm,
                        max_points: parseInt(value) || 0,
                      })
                    }
                    variant="bordered"
                    radius="lg"
                  />
                )}
              </div>
              <Input
                type="datetime-local"
                label="Due Date"
                value={materialForm.due_date}
                onValueChange={(value) =>
                  setMaterialForm({ ...materialForm, due_date: value })
                }
                isRequired
                variant="bordered"
                radius="lg"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={editDisclosure.onClose}
              radius="full"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleUpdateMaterial}
              isDisabled={!materialForm.name || !materialForm.due_date}
              radius="full"
            >
              Update Material
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  const renderItemViewModal = () => {
    return (
      <Modal
        isOpen={itemViewDisclosure.isOpen}
        onClose={handleCloseItemView}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          backdrop:
            "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
        }}
        radius="lg"
      >
        <ModalContent>
          <>
            {selectedItem && (
              <>
                <ModalHeader className="rounded-lg rounded-b-none bg-default-100 flex justify-between items-center p-4 bg-default-200 dark:bg-default-100">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">
                        {selectedItem.name}
                      </h2>
                      {isProfessorMode && (
                        <Chip
                          size="sm"
                          color="warning"
                          className="ml-2"
                          variant="flat"
                        >
                          Professor Mode
                        </Chip>
                      )}
                    </div>
                    <div className="flex items-center text-default-500 text-sm mt-1">
                      <span>Due: {formatDueDate(selectedItem.due_date)}</span>
                    </div>
                    {selectedItem.type !== "document" && (
                      <div className="flex items-center text-default-500 text-sm mt-1">
                        Points: {selectedItem.max_points}
                      </div>
                    )}
                  </div>
                </ModalHeader>

                <ModalBody className="p-6">
                  {itemLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Spinner size="lg" color="primary" />
                    </div>
                  ) : itemError ? (
                    <div className="bg-danger-50 p-4 rounded-lg text-danger-700">
                      <p>{itemError}</p>
                      <Button
                        className="mt-2"
                        color="primary"
                        variant="flat"
                        onPress={() => {
                          setItemError(null);
                          if (selectedItemId) fetchCourseItem(selectedItemId);
                        }}
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <>
                      {selectedItem.type === "quiz" ? (
                        <QuizContent
                          courseItem={selectedItem}
                          enrollment={enrollment!}
                          onSubmit={handleRefresh}
                          onRefresh={handleRefresh}
                        />
                      ) : selectedItem.type === "document" ? (
                        <div className="p-4 text-center text-default-500">
                          <p>Document content is not available yet.</p>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-default-500">
                          <p>
                            Content for {selectedItem.type} is not available
                            yet.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </ModalBody>
              </>
            )}
          </>
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
            <IconFileText size={20} />
          </span>
          Course Materials
        </h2>

        {isProfessorMode && (
          <Button
            color="primary"
            variant="flat"
            startContent={<IconPlus size={18} />}
            onPress={addDisclosure.onOpen}
            radius="full"
          >
            Add Material
          </Button>
        )}
      </div>
      <Divider />

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Spinner size="md" color="primary" />
        </div>
      ) : courseItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {courseItems.map((item) => (
            <Card
              key={item.id}
              className="border-none shadow-sm hover:shadow-md"
              radius="lg"
              isPressable
              onPress={() => handleViewMaterial(item.id)}
            >
              <CardBody className="flex flex-row justify-between items-center p-4">
                <div className="flex gap-4 items-center">
                  <div
                    className={`bg-${getMaterialChipColor(item.type)}-100 p-3 rounded-lg text-${getMaterialChipColor(item.type)}-500`}
                  >
                    {renderMaterialIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex gap-2 items-center">
                      <h3 className="font-semibold">{item.name}</h3>
                      <Chip
                        size="sm"
                        color={getMaterialChipColor(item.type)}
                        radius="full"
                      >
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </Chip>
                    </div>
                    <div
                      className="flex items-center gap-2"
                      style={{ marginTop: "10px" }}
                    >
                      <p className="text-xs text-default-500 bg-default-100 px-2 py-1 rounded-full">
                        Due: {formatDueDate(item.due_date)}
                      </p>
                      {item.type !== "document" && (
                        <p className="text-xs text-default-500 bg-default-100 px-2 py-1 rounded-full">
                          {item.max_points} points
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex" onClick={(e) => e.stopPropagation()}>
                  {isProfessorMode && (
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly variant="light" radius="full">
                          <IconDotsVertical size={18} />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Material actions">
                        <DropdownItem
                          key="edit"
                          startContent={<IconPencil size={16} />}
                          onPress={() => handleEditMaterial(item)}
                        >
                          Edit
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          startContent={<IconTrash size={16} />}
                          onPress={() => handleDeleteMaterial(item.id)}
                        >
                          Delete
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
          <Divider style={{ marginBottom: "25px" }} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-40">
          <p className="text-default-600">
            No course materials have been added yet.
          </p>
        </div>
      )}

      {renderAddMaterialModal()}
      {renderEditMaterialModal()}
      {renderItemViewModal()}
    </div>
  );
};
