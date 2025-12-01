import { Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

interface PreviewDeviceSelectorProps {
  device: PreviewDevice;
  onChange: (device: PreviewDevice) => void;
}

const devices = [
  { id: "desktop" as const, icon: Monitor, label: "Desktop", width: "100%" },
  { id: "tablet" as const, icon: Tablet, label: "Tablette", width: "768px" },
  { id: "mobile" as const, icon: Smartphone, label: "Mobile", width: "375px" },
];

export function PreviewDeviceSelector({ device, onChange }: PreviewDeviceSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      {devices.map((d) => (
        <Button
          key={d.id}
          variant={device === d.id ? "default" : "ghost"}
          size="sm"
          className={cn(
            "h-8 px-3 gap-1.5",
            device === d.id && "shadow-sm"
          )}
          onClick={() => onChange(d.id)}
        >
          <d.icon className="h-4 w-4" />
          <span className="text-xs hidden sm:inline">{d.label}</span>
        </Button>
      ))}
    </div>
  );
}

export function getPreviewWidth(device: PreviewDevice): string {
  switch (device) {
    case "mobile":
      return "375px";
    case "tablet":
      return "768px";
    case "desktop":
    default:
      return "100%";
  }
}

export function getPreviewMaxWidth(device: PreviewDevice): string {
  switch (device) {
    case "mobile":
      return "375px";
    case "tablet":
      return "768px";
    case "desktop":
    default:
      return "1280px";
  }
}
