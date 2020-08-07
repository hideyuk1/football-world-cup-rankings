import useResizeObserver from 'hooks/useResizeObserver';
import useThrottle from 'hooks/useThrottle';
import { useEffect, useState, useRef } from 'react';

export default function useWindowSize() {
    // const [contentRect, setContentRect] = useState(
    //     document.documentElement.getBoundingClientRect(),
    // );
    const [contentRect, setContentRect] = useState({ width: 0, height: 0 });
    const throttledCallback = useThrottle({ callback: setContentRect, fps: 2 });

    const documentRef = useRef(null);
    useEffect(() => {
        documentRef.current = document.documentElement;
    }, []);

    useResizeObserver({
        ref: documentRef.current,
        callback: throttledCallback,
    });
    return [contentRect.width, contentRect.height];
}
