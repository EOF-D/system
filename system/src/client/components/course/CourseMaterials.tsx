import { isProfessor } from "@/client/services/authService";
import {
  createCourseItem,
  deleteCourseItem,
  updateCourseItem,
} from "@/client/services/courseItemService";
import { formatDueDate } from "@/client/utils/format";
import { CourseItem } from "@/shared/types/models/courseItem";
import {
  Button,
  Card,
  CardBody,
  Chip,
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
  Spinner,
  Textarea,
  Divider,
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
  const localAddDisclosure = useDisclosure();
  const addDisclosure = modalDisclosure || localAddDisclosure;
  const editDisclosure = useDisclosure();

  const [materialForm, setMaterialForm] = useState({
    id: 0,
    name: "",
    description: "",
    type: "document" as "document" | "assignment" | "quiz",
    due_date: "",
    max_points: 0,
  });

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
        itemData,
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
        backdrop="blur"
        className="rounded-lg"
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
        backdrop="blur"
        className="rounded-lg"
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

        {isProfessor() && (
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
              className="border-none shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 bg-gradient-to-r from-white to-default-50"
              radius="lg"
            >
              <CardBody className="flex flex-row justify-between items-center p-4">
                <div className="flex gap-4 items-center">
                  <div
                    className={`bg-${getMaterialChipColor(item.type)}-100 p-3 rounded-lg text-${getMaterialChipColor(item.type)}-500`}
                  >
                    {renderMaterialIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex gap-2 items-center mb-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <Chip
                        size="sm"
                        color={getMaterialChipColor(item.type)}
                        radius="full"
                      >
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </Chip>
                    </div>
                    {item.description && (
                      <p className="text-sm text-default-600 mb-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
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
                <div className="flex">
                  {isProfessor() && (
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
        </div>
      ) : (
        <Card radius="lg" className="bg-default-50 p-6 text-center">
          <Divider />
          <CardBody>
            <p className="text-default-600">
              No course materials have been added yet.
            </p>
          </CardBody>
        </Card>
      )}

      {renderAddMaterialModal()}
      {renderEditMaterialModal()}
    </div>
  );
};
