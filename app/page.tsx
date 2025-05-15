"use client";

import { NoAgentNotification } from "@/components/NoAgentNotification";
import TranscriptionView from "@/components/TranscriptionView";
import {
  RoomAudioRenderer,
  RoomContext,
  VoiceAssistantControlBar,
  useVoiceAssistant,
} from "@livekit/components-react";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import { toast } from "react-toastify"; // Ensure you have react-toastify installed
import { AnimatePresence, motion } from "framer-motion";
import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import type { ConnectionDetails } from "./api/connection-details/route";
import { UploadPDFButton } from "@/components/UploadPDFButton";


export default function Page() {
  const [room] = useState(new Room());
  const [pdfUploaded, setPdfUploaded] = useState(false);

  const onConnectButtonClicked = useCallback(async () => {
    if (!pdfUploaded) {
      console.warn("PDF not uploaded");
      toast.warn("Please upload a PDF file before connecting."); // Show a warning message
      return; // Exit the function
    }
    try {
      const url = new URL(
        process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
        window.location.origin
      );
      const response = await fetch(url.toString());
      const connectionDetailsData: ConnectionDetails = await response.json();

      await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
      await room.localParticipant.setMicrophoneEnabled(true);
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect. Please try again."); // Handle connection errors
    }
  }, [room, pdfUploaded]);

  useEffect(() => {
    room.on(RoomEvent.MediaDevicesError, onDeviceFailure);

    return () => {
      room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
    };
  }, [room]);

  useEffect(() => {
    console.log("PDF Uploaded state updated:", pdfUploaded);
  }, [pdfUploaded]);

  const handlePDFUpload = useCallback(() => {
    setPdfUploaded(true);
    sessionStorage.setItem("pdfUploaded", "true");
  }, []);

  return (
    <main data-lk-theme="default" className="h-full grid content-center bg-[var(--lk-bg)]">
      <RoomContext.Provider value={room}>
        <div className="lk-room-container h-screen">
          <SimpleVoiceAssistant
            onConnectButtonClicked={onConnectButtonClicked}
            pdfUploaded={pdfUploaded}
            handlePDFUpload={handlePDFUpload} />
        </div>
      </RoomContext.Provider>
    </main>
  );
}


function SimpleVoiceAssistant(props: {
  onConnectButtonClicked: () => void;
  pdfUploaded: boolean;
  handlePDFUpload: () => void;
}) {
  const { state: agentState } = useVoiceAssistant();

  return (
    <div className="flex flex-col h-full">
      {/* Content above the ControlBar */}
      <div className="flex-grow overflow-y-auto">
        <AnimatePresence>
          <div className="w-3/4 lg:w-1/2 mx-auto h-full">
            <TranscriptionView />
          </div>
        </AnimatePresence>

        <RoomAudioRenderer />
        <NoAgentNotification state={agentState} />
      </div>

      <div className=" w-full bottom-4 flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-4">
          {!props.pdfUploaded && <UploadPDFButton onUploadAction={props.handlePDFUpload} />}
          {props.pdfUploaded && <div className="my-4 flex flex-col items-center">
            <p className="mt-2 text-sm">{"File uploded"}</p>
          </div>}
          {agentState === "disconnected" && (
            <motion.button
              key="start-conversation-button" // Provide a unique key here
              initial={{ opacity: 0, top: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, top: "-10px" }}
              transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
              className="uppercase px-4 py-2 bg-white text-black rounded-md z-10"
              onClick={() => props.onConnectButtonClicked()}
            >
              Start
            </motion.button>
          )}
          <ControlBar />
        </div>
      </div>
    </div >
  );
}

function ControlBar() {
  /**
   * Use Krisp background noise reduction when available.
   * Note: This is only available on Scale plan, see {@link https://livekit.io/pricing | LiveKit Pricing} for more details.
   */
  const krisp = useKrispNoiseFilter();
  useEffect(() => {
    krisp.setNoiseFilterEnabled(true);
  }, []);

  const { state: agentState } = useVoiceAssistant();

  return (
    <div className="relative h-[60px] flex items-center justify-center">
      <AnimatePresence>
        {agentState !== "disconnected" && agentState !== "connecting" && (
          <motion.div
            initial={{ opacity: 0, top: "10px" }}
            animate={{ opacity: 1, top: 0 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex items-center justify-center w-full h-full">

            <div className="flex items-center">
              <VoiceAssistantControlBar controls={{ leave: true, microphone: true }} />
              {/* <DisconnectButton>
                <CloseIcon />
              </DisconnectButton> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function onDeviceFailure(error: Error) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}
