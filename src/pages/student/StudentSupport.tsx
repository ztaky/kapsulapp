import { Routes, Route } from "react-router-dom";
import { TicketList } from "@/components/support/TicketList";
import { TicketDetail } from "@/components/support/TicketDetail";
import { Button } from "@/components/ui/button";
import { TicketPlus } from "lucide-react";
import { useState } from "react";
import { CreateTicketForm } from "@/components/support/CreateTicketForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function StudentSupportList() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Support
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Gérez vos demandes d'assistance
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <TicketPlus className="h-4 w-4 mr-2" />
              Nouveau ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un ticket</DialogTitle>
            </DialogHeader>
            <CreateTicketForm
              onSuccess={() => setShowCreate(false)}
              onCancel={() => setShowCreate(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <TicketList basePath="/student/support" />
    </div>
  );
}

function StudentSupportDetail() {
  return <TicketDetail isAdmin={false} backPath="/student/support" />;
}

export default function StudentSupport() {
  return (
    <Routes>
      <Route index element={<StudentSupportList />} />
      <Route path=":ticketId" element={<StudentSupportDetail />} />
    </Routes>
  );
}
