import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Receipt, Download, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Invoice {
  id: string;
  course_id: string;
  amount: number;
  status: string;
  purchased_at: string;
  courses: {
    title: string;
    cover_image: string;
  };
}

export default function Invoices() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        fetchInvoices(session.user.id);
      }
    });
  }, [navigate]);

  const fetchInvoices = async (userId: string) => {
    const { data, error } = await supabase
      .from("purchases")
      .select(`
        id,
        course_id,
        amount,
        status,
        purchased_at,
        courses (
          title,
          cover_image
        )
      `)
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false });

    if (!error && data) {
      setInvoices(data as Invoice[]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-orange-50/50 p-10 border border-slate-100 shadow-premium mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Mes Factures</h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Historique de vos achats et factures
          </p>
        </div>

        {invoices.length === 0 ? (
          <Card className="shadow-premium border-slate-100">
            <CardHeader className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                <Receipt className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-slate-900 tracking-tight">Aucune facture</CardTitle>
              <CardDescription className="text-slate-600 leading-relaxed">
                Vous n'avez pas encore effectué d'achat
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="shadow-premium border-slate-100 hover:shadow-elevated transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                      {invoice.courses.cover_image ? (
                        <img 
                          src={invoice.courses.cover_image} 
                          alt={invoice.courses.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Receipt className="h-8 w-8 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-lg tracking-tight truncate mb-1">
                        {invoice.courses.title}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {format(new Date(invoice.purchased_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          {invoice.status === 'completed' ? 'Payé' : invoice.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-slate-900 mb-3">
                        {invoice.amount} €
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl border-slate-200">
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}