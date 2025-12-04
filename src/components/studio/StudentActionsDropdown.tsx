import { useState } from "react";
import { MoreHorizontal, Eye, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { StudentCoursesDialog } from "./StudentCoursesDialog";

interface StudentActionsDropdownProps {
  student: {
    id: string;
    user_id: string;
    profiles: {
      id: string;
      full_name: string | null;
      email: string;
    } | null;
  };
  organizationId: string;
}

export function StudentActionsDropdown({ student, organizationId }: StudentActionsDropdownProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCoursesDialog, setShowCoursesDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("id", student.id);

      if (error) throw error;

      toast.success("Étudiant retiré de l'académie");
      queryClient.invalidateQueries({ queryKey: ["studio-students"] });
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowCoursesDialog(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Voir les cours
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowCoursesDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Assigner un cours
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Retirer de l'académie
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer cet étudiant ?</AlertDialogTitle>
            <AlertDialogDescription>
              {student.profiles?.full_name || student.profiles?.email} sera retiré de votre académie.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Retirer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StudentCoursesDialog
        open={showCoursesDialog}
        onOpenChange={setShowCoursesDialog}
        student={student}
        organizationId={organizationId}
      />
    </>
  );
}
