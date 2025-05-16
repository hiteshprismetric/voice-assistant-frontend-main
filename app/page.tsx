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
  BarVisualizer,
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
import { UploadPDFButton } from "@/components/UploadPDFButton";
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
            <p className="mt-2 text-sm" style={{ color: "green" }}>{"File uploded"}</p>
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

function ControlBar(props: React.HTMLAttributes<HTMLDivElement>) {
  const visibleControls = { leave: true, microphone: true };

  const krisp = useKrispNoiseFilter();
  useEffect(() => {
    krisp.setNoiseFilterEnabled(true);
  }, []);
  const localPermissions = useLocalParticipantPermissions();
  const { microphoneTrack, localParticipant } = useLocalParticipant();
  const { state: agentState } = useVoiceAssistant();
  const saveUserChoices = true;

  const micTrackRef: TrackReferenceOrPlaceholder = React.useMemo(() => {
    return {
      participant: localParticipant,
      source: Track.Source.Microphone,
      publication: microphoneTrack,
    };
  }, [localParticipant, microphoneTrack]);
  const htmlProps = mergeProps({ className: 'lk-agent-control-bar' }, props);

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
                <div className="lk-button-group" >
                  <TrackToggle
                    source={Track.Source.Microphone}
                    showIcon={true}
                    onChange={microphoneOnChange}
                  >
                    <BarVisualizer trackRef={micTrackRef} barCount={7} options={{ minHeight: 10 }} />
                  </TrackToggle>

                </div>
              </div>
              <DisconnectButton>{'Disconnect'}</DisconnectButton>
              {/* <VoiceAssistantControlBar controls={{ leave: true, microphone: true }} /> */}
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
