"use client";

import { NoAgentNotification } from "@/components/NoAgentNotification";
import TranscriptionView from "@/components/TranscriptionView";
import * as React from 'react';
import {
  RoomAudioRenderer,
  RoomContext,
  DisconnectButton,
  useVoiceAssistant,
  TrackToggle,
  useLocalParticipant,
  useLocalParticipantPermissions,
} from "@livekit/components-react";
import { usePersistentUserChoices } from '@livekit/components-react/hooks';
import { Track } from 'livekit-client';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import { toast } from "react-toastify"; // Ensure you have react-toastify installed
import { AnimatePresence, motion } from "framer-motion";
import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import type { ConnectionDetails } from "./api/connection-details/route";
import { CircularVisualizer } from "@/components/CircularVisualizer";
import { UploadPDFButton } from "@/components/UploadPDFButton";
import { CloseIcon } from "@/components/CloseIcon";
const mergeProps = (...props: React.HTMLAttributes<HTMLDivElement>[]): React.HTMLAttributes<HTMLDivElement> =>
  Object.assign({}, ...props);


export default function Page() {
  const [room] = useState(new Room());
  const [pdfUploaded, setPdfUploaded] = useState(false);

  const onConnectButtonClicked = useCallback(async () => {
    if (!pdfUploaded) {
      console.warn("PDF not uploaded");
      toast.warn("Please upload a PDF file before start."); // Show a warning message
      return; // Exit the function
    }
    try {
      const roomName = sessionStorage.getItem("roomName");
      const participantName = sessionStorage.getItem("participantName");

      let connectionDetailsData: ConnectionDetails;

      if (!roomName || !participantName) {
        // First-time session: get fresh details
        const url = new URL("/api/connection-details", window.location.origin);
        const response = await fetch(url.toString());
        connectionDetailsData = await response.json();

        sessionStorage.setItem("roomName", connectionDetailsData.roomName);
        sessionStorage.setItem("participantName", connectionDetailsData.participantName);
      } else {
        // Existing session: reuse values
        const url = new URL("/api/connection-details", window.location.origin);
        url.searchParams.set("roomName", roomName);
        url.searchParams.set("participantName", participantName);

        const response = await fetch(url.toString());
        connectionDetailsData = await response.json();
      }
      console.log(`Connecting to server: ${connectionDetailsData.serverUrl} with token: ${connectionDetailsData.participantToken} with participantName: ${connectionDetailsData.participantName} with roomName: ${connectionDetailsData.roomName}`);
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

  useEffect(() => {
    const roomName = sessionStorage.getItem("roomName") || "DefaultRoom";
    console.log("Room name retrieved:", roomName);

    sessionStorage.removeItem("roomName");
    sessionStorage.removeItem("participantName");

    const roomNames = sessionStorage.getItem("roomName") || "DefaultRoom";
    console.log("Room name retrieved:", roomNames);
  }, []);
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
          <div className="w-full lg:w-[95%] mx-auto h-full">
            <TranscriptionView />
          </div>
        </AnimatePresence>

        <RoomAudioRenderer />
        <NoAgentNotification state={agentState} />
      </div>

      <div className=" w-full flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-4">
          {!props.pdfUploaded && <UploadPDFButton onUploadAction={props.handlePDFUpload} />}
          {props.pdfUploaded && <div className="my-4 flex flex-col items-center">
            <p className="my-2 text-sm" style={{ color: "green" }}>{"File uploaded"}</p>
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

        {/* <div className="w-full lg:w-[95%] mx-auto bg-gray-800 rounded-2xl p-2 flex items-center space-x-4 bottom-4">
          <div className="flex-shrink-0">
            {!props.pdfUploaded && (
              <UploadPDFButton onUploadAction={props.handlePDFUpload} />
            )}
            {props.pdfUploaded && (
              <div className="flex flex-col items-center">
                <p className="text-sm text-green-600">File uploaded</p>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Type your message..."
              className="w-full px-4 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {agentState === "disconnected" ? (
              <motion.button
                key="start-conversation-button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
                className="uppercase px-4 py-2 bg-white text-black rounded-md"
                onClick={() => props.onConnectButtonClicked()}
              >
                Start
              </motion.button>
            ) : (
              <>
                <ControlBar />
                <button
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div> */}
      </div>
    </div >
  );
}

function ControlBar(props: React.HTMLAttributes<HTMLDivElement>) {
  const visibleControls = { leave: true, microphone: true };
  const krisp = useKrispNoiseFilter();
  const krispInitializedRef = React.useRef(false); // ✅ Add here
  const { state: agentState } = useVoiceAssistant();

  const localPermissions = useLocalParticipantPermissions();
  const { microphoneTrack, localParticipant } = useLocalParticipant();
  const saveUserChoices = true;
  const htmlProps = mergeProps({ className: 'lk-agent-control-bar' }, props);


  useEffect(() => {
    const isLive = ["listening", "thinking", "speaking"].includes(agentState);

    if (isLive && krisp && !krispInitializedRef.current) {
      try {
        if (!krisp.isNoiseFilterEnabled) {
          console.log("Initializing noise filter...");
          krisp.setNoiseFilterEnabled(true);
          krispInitializedRef.current = true;
        }
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes("already initialized")
        ) {
          console.warn("Krisp SDK already initialized, skipping.");
          krispInitializedRef.current = true;
        } else {
          console.error("Krisp initialization failed:", error);
        }
      }
    }

    if (agentState === "disconnected") {
      krisp.setNoiseFilterEnabled(false); // Disable filter
      krispInitializedRef.current = false;
    }
  }, [agentState, krisp]);


  const micTrackRef: TrackReferenceOrPlaceholder = React.useMemo(() => {
    return {
      participant: localParticipant,
      source: Track.Source.Microphone,
      publication: microphoneTrack,
    };
  }, [localParticipant, microphoneTrack]);

  if (!localPermissions) {
    visibleControls.microphone = false;
  } else {
    visibleControls.microphone ??= localPermissions.canPublish;
  }

  const { saveAudioInputEnabled } = usePersistentUserChoices({
    preventSave: !saveUserChoices,
  });

  const microphoneOnChange = React.useCallback(
    (enabled: boolean, isUserInitiated: boolean) => {
      if (isUserInitiated) {
        saveAudioInputEnabled(enabled);
      }
    },
    [saveAudioInputEnabled],
  );

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
              <div {...htmlProps}>
                <div>
                  <TrackToggle
                    source={Track.Source.Microphone}
                    showIcon={true}
                    onChange={microphoneOnChange}
                  >
                    {/* <BarVisualizer trackRef={micTrackRef} barCount={7} options={{ minHeight: 10 }} /> */}
                  </TrackToggle>

                </div>

                <CircularVisualizer trackRef={micTrackRef} barCount={7} size={40} />
              </div>
              {/* <DisconnectButton>{'Disconnect'}</DisconnectButton> */}
              {/* <VoiceAssistantControlBar controls={{ leave: true, microphone: true }} /> */}
              <DisconnectButton>
                <CloseIcon />
              </DisconnectButton>
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
