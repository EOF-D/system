import RichTextEditor from "reactjs-tiptap-editor";
import {
  BaseKit,
  Bold,
  BulletList,
  Code,
  CodeBlock,
  Color,
  FontFamily,
  FontSize,
  FormatPainter,
  Heading,
  Highlight,
  Italic,
} from "reactjs-tiptap-editor/extension-bundle";
import "reactjs-tiptap-editor/style.css";

const extensions = [
  BaseKit.configure({
    characterCount: {
      limit: 9_000,
    },
  }),
  Bold,
  Italic,
  Code,
  CodeBlock,
  Color,
  FontFamily,
  FontSize,
  FormatPainter,
  Heading,
  Highlight,
  BulletList,
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
