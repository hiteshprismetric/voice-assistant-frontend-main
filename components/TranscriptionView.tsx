import useCombinedTranscriptions from "@/hooks/useCombinedTranscriptions";
import * as React from "react";

export default function TranscriptionView() {
  const combinedTranscriptions = useCombinedTranscriptions();

  // scroll to bottom when new transcription is added
  React.useEffect(() => {
    const transcription = combinedTranscriptions[combinedTranscriptions.length - 1];
    if (transcription) {
      const transcriptionElement = document.getElementById(transcription.id);
      if (transcriptionElement) {
        transcriptionElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [combinedTranscriptions]);

  return (
    <div className="h-full flex flex-col gap-2 overflow-y-auto">
      {combinedTranscriptions.map((segment) => (
        <div
          id={segment.id}
          key={segment.id}
          className={
            segment.role === "assistant"
              ? "bg-gray-700 rounded-md p-2 self-start mr-4 fit-content"
              : "bg-gray-800 rounded-md p-2 self-end ml-4 fit-content"
          } style={{
            marginLeft: segment.role !== "assistant" ? "10%" : "0",
            marginRight: segment.role === "assistant" ? "10%" : "0",
          }}
        >
          {segment.text}
        </div>
      ))}
    </div>
  );
}
