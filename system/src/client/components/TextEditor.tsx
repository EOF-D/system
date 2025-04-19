import RichTextEditor from "reactjs-tiptap-editor";
import {
  BaseKit,
  Bold,
  BulletList,
  Code,
  Color,
  FontSize,
  Heading,
  Italic,
  TextAlign,
} from "reactjs-tiptap-editor/extension-bundle";
import "reactjs-tiptap-editor/style.css";

const extensions = [
  BaseKit.configure({
    multiColumn: true,
    placeholder: {
      showOnlyCurrent: true,
    },
    characterCount: {
      limit: 50_000,
    },
  }),
  Italic,
  Bold,
  Code,
  Color,
  FontSize,
  BulletList,
  Heading,
  TextAlign,
];

/**
 * TextEditor component to render a rich text editor. Utility for shared extensions.
 * @param {object} props - The props for the TextEditor component.
 * @returns {JSX.Element} The TextEditor component.
 */
export function TextEditor(props: any): JSX.Element {
  return (
    <div>
      <RichTextEditor output="html" extensions={extensions} {...props} />
    </div>
  );
}
