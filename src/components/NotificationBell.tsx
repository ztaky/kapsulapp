import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, ShoppingCart, Users, BookOpen, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  variant?: "light" | "dark";
}

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  purchase: { icon: ShoppingCart, color: "text-green-500" },
  member: { icon: Users, color: "text-blue-500" },
  course: { icon: BookOpen, color: "text-purple-500" },
  info: { icon: Info, color: "text-slate-500" },
};

export function NotificationBell({ variant = "light" }: NotificationBellProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const isDark = variant === "dark";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            isDark 
              ? "text-slate-400 hover:text-white hover:bg-slate-800" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-96 p-0",
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        )}
        align="end"
      >
        <div className={cn(
          "flex items-center justify-between p-4 border-b",
          isDark ? "border-slate-800" : "border-slate-200"
        )}>
          <h3 className={cn(
            "font-semibold",
            isDark ? "text-white" : "text-slate-900"
          )}>
            Notifications
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className={cn(
                "h-8 text-xs",
                isDark 
                  ? "text-slate-400 hover:text-white hover:bg-slate-800" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              )}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className={cn(
              "p-8 text-center",
              isDark ? "text-slate-500" : "text-slate-400"
            )}>
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {notifications.map((notification) => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
                const Icon = config.icon;
                
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full p-4 text-left transition-colors",
                      isDark 
                        ? "hover:bg-slate-800/50" 
                        : "hover:bg-slate-50",
                      !notification.is_read && (isDark ? "bg-slate-800/30" : "bg-blue-50/50")
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        isDark ? "bg-slate-800" : "bg-slate-100"
                      )}>
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "font-medium text-sm",
                            isDark ? "text-white" : "text-slate-900"
                          )}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className={cn(
                          "text-sm",
                          isDark ? "text-slate-400" : "text-slate-600"
                        )}>
                          {notification.message}
                        </p>
                        <p className={cn(
                          "text-xs mt-1",
                          isDark ? "text-slate-500" : "text-slate-400"
                        )}>
                          {formatDistanceToNow(new Date(notification.created_at), { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
