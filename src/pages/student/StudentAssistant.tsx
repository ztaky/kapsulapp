import { AIAssistantChat } from "@/components/AIAssistantChat";

const StudentAssistant = () => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Assistant Pédagogique IA
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          Posez vos questions et obtenez de l'aide sur vos formations
        </p>
      </div>
      
      <AIAssistantChat />
    </div>
  );
};

export default StudentAssistant;
