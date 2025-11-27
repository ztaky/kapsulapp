import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Bell, Shield, Database } from "lucide-react";

const AdminSettings = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Paramètres</h1>
        <p className="text-slate-400">Configuration de la plateforme</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Général</CardTitle>
                <CardDescription className="text-slate-400">
                  Paramètres généraux de la plateforme
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 text-sm">
              Bientôt disponible
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-600">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Notifications</CardTitle>
                <CardDescription className="text-slate-400">
                  Gérer les notifications système
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 text-sm">
              Bientôt disponible
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-600">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Sécurité</CardTitle>
                <CardDescription className="text-slate-400">
                  Paramètres de sécurité
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 text-sm">
              Bientôt disponible
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-600">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Base de données</CardTitle>
                <CardDescription className="text-slate-400">
                  Gestion des données
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 text-sm">
              Bientôt disponible
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
