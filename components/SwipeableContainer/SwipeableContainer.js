import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './SwipeableContainer.module.scss';

function unifyTouchAndClick(e) {
    return e.changedTouches ? e.changedTouches[0] : e;
}

const SwipeableContainer = ({ children, labels, resizeTrigger }) => {
    const [selectedTab, setSelectedTab] = useState(0);

    // in %
    const [translateX, setTranslateX] = useState(0);
    const [transition, setTransition] = useState();
    const [isClicked, setIsClicked] = useState(false);
    const [x, setX] = useState(0);
    const [dx, setDx] = useState(0);

    const onTouchStart = useCallback((e) => {
        setTransition();
        e.preventDefault();
        setX(unifyTouchAndClick(e).clientX);
        setIsClicked(true);
    }, []);

    const onTouchMove = useCallback(
        (e) => {
            if (isClicked === true) {
                const dx = unifyTouchAndClick(e).clientX - x; // in px
                if (Math.abs(dx) > 30) setDx((dx / e.currentTarget.offsetWidth) * 100); // in px
            }
        },
        [isClicked, x],
    );

    const onTouchUp = (e) => {
        setIsClicked(false);

        let newTranslateX = translateX;

        if (Math.abs(dx) > 10) {
            newTranslateX += dx > 0 ? 100 : -100;
        }

        if (newTranslateX > 0 || newTranslateX < -(children.length - 1) * 100) {
            newTranslateX = translateX;
        }

        setTransition('transform 0.35s cubic-bezier(0.15, 0.3, 0.25, 1) 0s');
        setSelectedTab(-newTranslateX / 100);
        setDx(0);
    };

    useEffect(() => {
        window.onmouseup = onTouchUp;
        window.ontouchend = onTouchUp;
    }, [translateX, dx]);

    useEffect(() => {
        setTranslateX(-selectedTab * 100);
    }, [selectedTab]);

    const autoHeightRef = useMemo(
        () => (index) => (node) => {
            if (!node) return;
            if (index === selectedTab) {
                node.style.height = node.firstElementChild.scrollHeight + 32 + 'px';
            } else {
                node.style.height = 'auto';
            }
        },
        [resizeTrigger, selectedTab],
    );

    const underlineTransformX = useMemo(() => {
        const newTransformX = -(translateX + dx);
        const minValue = 0;
        const maxValue = (children.length - 1) * 100;
        if (newTransformX < minValue) return 0;
        if (newTransformX > maxValue) return maxValue;
        return newTransformX;
    }, [translateX, dx]);

    return (
        <>
            <div className={styles.tabsContainer}>
                {labels.map((label, index) => (
                    <div
                        className={styles.labelWrapper}
                        key={index}
                        onClick={() => setSelectedTab(index)}
                    >
                        {label}
                        {index === 0 && (
                            <div
                                className={styles.underlineSelected}
                                style={{
                                    transform: `translateX(${underlineTransformX}%)`,
                                    transition,
                                }}
                            ></div>
                        )}
                    </div>
                ))}
            </div>
            <div className={styles.rootContainer}>
                <div
                    className={styles.container}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    style={{
                        transform: `translateX(${translateX + dx}%)`,
                        transition,
                    }}
                >
                    {React.Children.map(children, (child, index) => {
                        return (
                            <div
                                key={labels[index]}
                                className={styles.view}
                                ref={autoHeightRef(index)}
                            >
                                {child}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default SwipeableContainer;
