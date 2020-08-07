import { useEffect, useRef } from 'react';

export default function useDidUpdate(callback, deps) {
    const didMount = useRef(false);

    useEffect(() => {
        if (didMount.current) {
            callback();
        } else {
            didMount.current = true;
        }
    }, deps);
}
