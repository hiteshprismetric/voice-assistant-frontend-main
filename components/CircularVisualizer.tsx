import * as React from 'react';
import { useMultibandTrackVolume, type AgentState } from '@livekit/components-react/hooks';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { useMaybeTrackRefContext } from '@livekit/components-react';
import {
    useBarAnimator
} from "./customUseBarAnimator";


interface CircularVisualizerProps {
    state?: AgentState;
    trackRef?: TrackReferenceOrPlaceholder;
    barCount?: number;
    size?: number; // Diameter of the circle
    barColor?: string;
    circleColor?: string;
}
const sequencerIntervals = new Map<AgentState, number>([
    ['connecting', 2000],
    ['initializing', 2000],
    ['listening', 500],
    ['thinking', 150],
]);

const getSequencerInterval = (state: AgentState | undefined, barCount: number): number | undefined => {
    if (!state) return 1000;
    let interval = sequencerIntervals.get(state);
    if (interval && state === 'connecting') interval /= barCount;
    return interval;
};
export const CircularVisualizer: React.FC<CircularVisualizerProps> = ({
    state,
    trackRef,
    barCount = 9,
    size = 100,
    barColor = "#ffffff",
    circleColor = "#1d1d1d",
}) => {
    let trackReference = useMaybeTrackRefContext();
    if (trackRef) trackReference = trackRef;

    const volumeBands = useMultibandTrackVolume(trackReference, {
        bands: barCount,
        loPass: 100,
        hiPass: 200,
        updateInterval: 200, // Ensure frequent updates
    });

    const highlightedIndices = useBarAnimator(state, barCount, getSequencerInterval(state, barCount) ?? 100);
    // Debug: Log volumeBands to verify updates
    React.useEffect(() => {
        console.log('volumeBands:', volumeBands);
    }, [volumeBands]);

    React.useEffect(() => {
        console.log('trackReference:', trackReference);
    }, [trackReference]);

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: circleColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                position: 'relative',
            }}
        >
            {/* Horizontal Track Bar Container */}
            <div
                style={{
                    width: size * 0.7, // 70% of circle width
                    height: size * 0.1, // Bar height
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center', // Center bars horizontally
                    gap: '2px',
                    padding: '5px',
                    borderRadius: '10px',
                    position: 'absolute',
                }}
            >
                {volumeBands.map((volume, idx) => (
                    <div
                        key={`bar-${idx}`}
                        style={{
                            width: `${(size * 0.7) / barCount}px`,
                            height: `${Math.max(size * 0.6 * volume, size * 0.02)}px`, // Dynamic height based on volume
                            backgroundColor: barColor, // Consistent bar color
                            opacity: highlightedIndices.includes(idx) ? 1 : 0.4, // Highlight active bars
                            transition: 'height 0.05s ease, opacity 0.05s ease', // Smooth transitions
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
