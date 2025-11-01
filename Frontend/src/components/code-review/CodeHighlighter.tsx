import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeHighlighterProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
}

export const CodeHighlighter = ({
  code,
  language,
  showLineNumbers = true,
}: CodeHighlighterProps) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      showLineNumbers={showLineNumbers}
      customStyle={{
        borderRadius: "0.5rem",
        fontSize: "0.875rem",
        padding: "1rem",
      }}
      lineNumberStyle={{
        minWidth: "3em",
        paddingRight: "1em",
        color: "#6b7280",
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
};
