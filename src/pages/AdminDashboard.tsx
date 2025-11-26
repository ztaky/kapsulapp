import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // This page is deprecated - redirect to Super Admin
    toast.info("Cette page a été remplacée");
    navigate("/super-admin");
  }, [navigate]);

  return null;
};

export default AdminDashboard;
