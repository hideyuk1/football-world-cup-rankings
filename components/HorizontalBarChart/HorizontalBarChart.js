import * as d3 from 'd3';
import useDidUpdate from 'hooks/useDidUpdate';
import React, { createRef, Fragment, useEffect, useMemo, useState } from 'react';
import styles from './HorizontalBarChart.module.scss';

const ENTERING_STATE = 'ENTERING_STATE';
const ENTERED_STATE = 'ENTERED_STATE';
const EXITING_STATE = 'EXITING_STATE';
const EXITED_STATE = 'EXITED_STATE';

function HorizontalBarChart(
    {
        data,
        nameKey = 'name',
        valueKey = 'value',
        enterExitTrigger = false,
        onEntering = () => null,
        onEntered = () => null,
        onExiting = () => null,
        onExited = () => null,
    },
    ref,
) {
    const [transitionState, setTransitionState] = useState(EXITED_STATE);

    const yScale = useMemo(
        () =>
            d3
                .scaleBand()
                .domain(data.map((element) => element[nameKey]))
                .rangeRound([0, 100])
                .padding(0.4)
                .paddingOuter(0.3),
        [],
    );

    const xScale = useMemo(
        () =>
            d3
                .scaleLinear()
                .domain([0, d3.max(data.map((element) => element[valueKey]))])
                .rangeRound([0, 100]),
        [],
    );

    const animationRefs = useMemo(() => data.map((_) => createRef()), []);

    const setupTransition = useMemo(() => {
        return data.map((_, index) => (node) => {
            if (!node) return;
            animationRefs[index].current = node.animate(
                [
                    { opacity: 0, transform: 'scaleX(0.5)' },
                    { opacity: 1, transform: 'scaleX(1)' },
                ],
                { duration: 200, easing: 'ease', fill: 'both' },
            );
            animationRefs[index].current.pause();
            animationRefs[index].current.onfinish = () => {
                if (animationRefs[index].current.playbackRate > 0)
                    setTransitionState(ENTERED_STATE);
                else setTransitionState(EXITED_STATE);
            };
        });
    }, []);

    const triggerAnimation = () => {
        setTransitionState(enterExitTrigger ? ENTERING_STATE : EXITING_STATE);
        for (let animationRef of animationRefs) {
            animationRef.current.playbackRate = enterExitTrigger ? 1 : -1;
            animationRef.current.play();
        }
    };

    // enter on render
    useEffect(() => {
        if (enterExitTrigger) triggerAnimation();
    }, []);

    useDidUpdate(() => {
        triggerAnimation();
    }, [enterExitTrigger]);

    useDidUpdate(() => {
        switch (transitionState) {
            case ENTERING_STATE:
                return onEntering();
            case ENTERED_STATE:
                return onEntered();
            case EXITING_STATE:
                return onExiting();
            case EXITED_STATE:
                return onExited();
        }
    }, [transitionState]);

    return (
        <Fragment>
            <div className={styles.chartContent} ref={ref.chart}>
                {data.map((element, index) => (
                    <div
                        className={styles.row}
                        key={index}
                        style={{
                            height: `${yScale.bandwidth()}%`,
                            top: `${yScale(element[nameKey])}%`,
                        }}
                    >
                        <div className={styles.label}>{element[nameKey]}</div>
                        <div className={styles.barContainer}>
                            <div
                                className={styles.bar}
                                style={{
                                    width: `${xScale(element[valueKey])}%`,
                                }}
                                ref={setupTransition[index]}
                            >
                                <span style={{ color: 'white', fontFamily: 'Inter' }}>
                                    {element[valueKey]}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Fragment>
    );
}

export default React.forwardRef(HorizontalBarChart);
