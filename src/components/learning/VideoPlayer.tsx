interface VideoPlayerProps {
  url: string;
}

export function VideoPlayer({ url }: VideoPlayerProps) {
  const getEmbedUrl = (videoUrl: string) => {
    // YouTube
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      const videoId = videoUrl.includes("youtu.be")
        ? videoUrl.split("youtu.be/")[1]?.split("?")[0]
        : new URL(videoUrl).searchParams.get("v");
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Vimeo
    if (videoUrl.includes("vimeo.com")) {
      const videoId = videoUrl.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }

    // Direct video URL
    return videoUrl;
  };

  const embedUrl = getEmbedUrl(url);
  const isDirectVideo = !url.includes("youtube") && !url.includes("vimeo");

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-black shadow-premium border border-slate-200" style={{ paddingBottom: "56.25%" }}>
      {isDirectVideo ? (
        <video
          controls
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
        >
          Votre navigateur ne supporte pas la lecture de vidéos.
        </video>
      ) : (
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Vidéo de la leçon"
        />
      )}
    </div>
  );
}
