import { usePlatformSetting, TrackingSetting } from "@/hooks/usePlatformSettings";
import { TrackingScripts } from "./TrackingScripts";

export function KapsulTracking() {
  const { data: tracking } = usePlatformSetting<TrackingSetting>("tracking");

  if (!tracking) return null;

  return (
    <TrackingScripts
      gtmContainerId={tracking.gtm_container_id || undefined}
      facebookPixelId={tracking.facebook_pixel_id || undefined}
    />
  );
}
