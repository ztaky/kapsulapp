import { FolderOpen, FileText } from "lucide-react";

interface Lesson {
  title: string;
  type?: "video" | "interactive_tool";
}

interface Module {
  title: string;
  lessons: Lesson[];
}

interface ModulesPreviewProps {
  modules: Module[];
  courseTopic?: string;
}

export function ModulesPreview({ modules, courseTopic }: ModulesPreviewProps) {
  return (
    <div className="space-y-4">
      {courseTopic && (
        <p className="text-sm text-slate-600">
          Structure proposée pour : <span className="font-medium text-slate-900">{courseTopic}</span>
        </p>
      )}
      <div className="space-y-3">
        {modules.map((module, idx) => (
          <div key={idx} className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-slate-900 text-sm">
                Module {idx + 1}: {module.title}
              </span>
            </div>
            <div className="space-y-1.5 pl-6">
              {module.lessons.map((lesson, lessonIdx) => (
                <div key={lessonIdx} className="flex items-center gap-2 text-xs text-slate-600">
                  <FileText className="h-3 w-3 text-slate-400" />
                  {lesson.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        {modules.length} modules • {modules.reduce((acc, m) => acc + m.lessons.length, 0)} leçons au total
      </p>
    </div>
  );
}
