import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Receipt, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Purchase {
  id: string;
  purchased_at: string;
  amount: number;
  status: string;
  courses: {
    title: string;
    cover_image: string | null;
  };
}

const StudentInvoices = () => {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          id,
          purchased_at,
          amount,
          status,
          courses (
            title,
            cover_image
          )
        `)
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setPurchases(data || []);
      }
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Mes Factures
        </h2>
        <p className="text-base text-slate-600 leading-relaxed">
          Historique de vos achats et factures
        </p>
      </div>

      {purchases.length === 0 ? (
        <Card className="shadow-premium border-slate-100">
          <CardHeader className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-slate-900 tracking-tight">Aucune facture</CardTitle>
            <CardDescription className="text-slate-600 leading-relaxed">
              Vous n'avez pas encore effectué d'achats
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="shadow-premium hover:shadow-elevated transition-all border-slate-100">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {purchase.courses.cover_image ? (
                      <img
                        src={purchase.courses.cover_image}
                        alt={purchase.courses.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900 tracking-tight mb-1">
                          {purchase.courses.title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {format(new Date(purchase.purchased_at), "d MMMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-slate-900 mb-1">
                          {purchase.amount} €
                        </p>
                        <Badge 
                          variant={purchase.status === "completed" ? "default" : "secondary"}
                          className="bg-green-100 text-green-700 hover:bg-green-200"
                        >
                          {purchase.status === "completed" ? "Payé" : purchase.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentInvoices;
