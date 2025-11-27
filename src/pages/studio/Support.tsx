import { Routes, Route, useParams } from "react-router-dom";
import { TicketList } from "@/components/support/TicketList";
import { TicketDetail } from "@/components/support/TicketDetail";
import { Button } from "@/components/ui/button";
import { TicketPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { CreateTicketForm } from "@/components/support/CreateTicketForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

function StudioSupportList() {
  const { slug } = useParams();
  const [showCreate, setShowCreate] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | undefined>();

  useEffect(() => {
    const fetchOrg = async () => {
      if (slug) {
        const { data } = await supabase
          .from("organizations")
          .select("id")
          .eq("slug", slug)
          .single();
        if (data) setOrganizationId(data.id);
      }
    };
    fetchOrg();
  }, [slug]);

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
              organizationId={organizationId}
              onSuccess={() => setShowCreate(false)}
              onCancel={() => setShowCreate(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <TicketList basePath={`/school/${slug}/studio/support`} />
    </div>
  );
}

function StudioSupportDetail() {
  const { slug } = useParams();
  return <TicketDetail isAdmin={false} backPath={`/school/${slug}/studio/support`} />;
}

export default function StudioSupport() {
  return (
    <Routes>
      <Route index element={<StudioSupportList />} />
      <Route path=":ticketId" element={<StudioSupportDetail />} />
    </Routes>
  );
}
