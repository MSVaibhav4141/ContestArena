import Editor, { Monaco, OnMount } from "@monaco-editor/react"
import { useRef } from "react"
import * as monaco from 'monaco-editor';

interface Props {
  code: string
  language: string
  onLanguageChange: (index: number) => void
  onReset: () => void // <--- NEW PROP
  beforeMount: (monaco: Monaco) => void
}

export default function CodeEditorPanel({ code, language, onLanguageChange, onReset, beforeMount }: Props) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-xl overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 bg-[#2d2d2d] text-white select-none">
        <span className="font-semibold text-sm">Solution Editor</span>
        <div className="flex items-center gap-3">
            {/* Reset Button */}
            <button 
                onClick={() => {
                    if(confirm("Reset code to default boilerplate? All changes will be lost.")) {
                       onReset(); // <--- Call the passed function
                    }
                }}
                className="text-xs text-gray-400 hover:text-white transition-colors"
            >
                Reset
            </button>
            
            {/* Language Selector */}
            {/* Note: We use value={...} to make it a controlled component if you want strictly sync UI, 
                but for now a simple select is fine as long as onLanguageChange updates the parent state */}
            <select 
                onChange={(e) => onLanguageChange(Number(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                value={language === 'cpp' ? 0 : language === 'rust' ? 1 : language === 'javascript' ? 2 : 0} 
            >
                <option value="0">C++</option>
                <option value="1">Rust</option>
                <option value="2">JavaScript</option>
            </select>
        </div>
      </div>

      <Editor
        theme="vs-dark"
        language={language}
        value={code} // This value prop ensures the editor updates when parent state resets
        beforeMount={beforeMount}
        onMount={handleEditorDidMount}
        height="100%"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  )
}