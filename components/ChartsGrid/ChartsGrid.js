import useDidUpdate from 'hooks/useDidUpdate';
import usePrevious from 'hooks/usePrevious';
import useWindowSize from 'hooks/useWindowSize';
import { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import HorizontalBarChart from 'components/HorizontalBarChart/HorizontalBarChart';
import styles from './ChartsGrid.module.scss';

const ENTERING_STATE = 'ENTERING_STATE';
const ENTERED_STATE = 'ENTERED_STATE';
const EXITING_STATE = 'EXITING_STATE';
const EXITED_STATE = 'EXITED_STATE';

const ChartsGrid = ({ charts, chartHeight = 600, onTransitionStateChange = () => null }) => {
    const [chartsTransitionState, setChartsTransitionState] = useState(
        charts.map(() => EXITED_STATE),
    );

    // array representing chart expansion animation trigger:
    // [false, false, ...] => [true, false, ...]  triggers animation in first chart
    const [animationTriggers, setAnimationTrigger] = useState(charts.map(() => false));
    // store previous array to detect which index was triggered
    const prevOnOffAnimationTriggers = usePrevious(animationTriggers);

    // same as animationTriggers but for bar animations
    const [barsEnterAnimation, setBarsEnterAnimation] = useState(charts.map(() => false));

    // array representing the transform: translateY attribute for each chart
    const [cellTranslateYs, setCellTranslateYs] = useState(charts.map(() => 0));

    // array representing the row in which each chart is at
    const [cellsRowNumbers, setCellsRowNumbers] = useState(charts.map(() => 0));

    const [windowWidth, windowHeight] = useWindowSize();

    const isExpandingOrExpanded = useCallback(
        (state) => state === ENTERED_STATE || state === ENTERING_STATE,
        [],
    );

    const lastRowIndex = useMemo(() => cellsRowNumbers[charts.length - 1], [
        cellsRowNumbers.join(),
    ]);

    const toggleChart = (index) => {
        // closed -> open
        if (!animationTriggers[index]) {
            setBarsEnterAnimation((prev) => Object.values({ ...prev, [index]: !prev[index] }));
            return setAnimationTrigger((prev) => Object.values({ ...prev, [index]: !prev[index] }));
        }

        // opened -> close
        // exit bars first
        else {
            setBarsEnterAnimation((prev) => Object.values({ ...prev, [index]: !prev[index] }));
        }
    };

    // when bar animation exit, trigger chart minimize animation
    const onBarExited = (index) => {
        setAnimationTrigger((prev) => Object.values({ ...prev, [index]: false }));
    };

    const translateCells = (index) => {
        const {
            chart: { animation, cell },
        } = refs[index];

        let cellIndex = 0;
        let shoudTranslate = true;

        // get same row cells
        for (let ref of refs) {
            // check for exapanded cells in same row
            if (
                cellsRowNumbers[cellIndex] === cellsRowNumbers[index] &&
                cellIndex !== index &&
                isExpandingOrExpanded(chartsTransitionState[cellIndex])
            ) {
                shoudTranslate = false;
                break;
            }
            cellIndex++;
        }

        if (shoudTranslate) {
            let translateYPx = chartHeight * -animation.current.playbackRate;
            let transformIndex = 0;
            let newTransforms = [];
            for (let ref of refs) {
                let newTransform = cellTranslateYs[transformIndex];
                // check for cells below
                if (cellsRowNumbers[index] < cellsRowNumbers[transformIndex]) {
                    newTransform += translateYPx;
                }
                newTransforms.push(newTransform);
                transformIndex++;
            }
            setCellTranslateYs(newTransforms);
        }
    };

    const refs = useMemo(() => {
        return charts.map(() => ({
            chart: {
                cell: createRef(),
                title: createRef(),
                body: createRef(),
                animation: createRef(),
            },
        }));
    }, []);

    const getRowNumbers = () => {
        let newCellsRowNumbers = [];
        let index = 0;
        let rowNumber = 0;
        for (const ref of refs) {
            if (index === 0) {
                newCellsRowNumbers.push(0);
                index++;
                continue;
            }
            if (ref.chart.cell.current.offsetTop > refs[index - 1].chart.cell.current.offsetTop)
                rowNumber++;
            newCellsRowNumbers.push(rowNumber);
            index++;
        }
        return newCellsRowNumbers;
    };
    useEffect(() => {
        setCellsRowNumbers(getRowNumbers());
    }, [windowWidth, windowHeight]);

    useEffect(() => {
        // iterate all rows and check if there is at least one expanded chart
        // generate object:  { <rowIndex>: <boolean expanded>, ... }
        let rowsExpandedStatus = cellsRowNumbers.reduce((acc, rowNumber, cellIndex) => {
            if (isExpandingOrExpanded(chartsTransitionState[cellIndex])) acc[rowNumber] = true;
            if (!acc[rowNumber]) acc[rowNumber] = false;
            return acc;
        }, {});

        // count how many expanded rows are above
        // and set transform accordingly
        let newTransforms = [];
        for (let rowNumber of cellsRowNumbers) {
            let newTransform = 0;
            for (let i = rowNumber - 1; i >= 0; i--) {
                if (rowsExpandedStatus[i]) newTransform += chartHeight;
            }
            newTransforms.push(newTransform);
        }
        setCellTranslateYs(newTransforms);
    }, [cellsRowNumbers.join('')]);

    const setupRefs = useMemo(() => {
        return charts.map((_, index) => {
            return (node) => {
                if (!node) return;
                if (node !== null) {
                    const animation = node.animate(
                        [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }],
                        {
                            duration: 200,
                            fill: 'both',
                            easing: 'linear',
                        },
                    );
                    animation.pause();
                    animation.reverse();
                    animation.onfinish = () => {
                        setChartsTransitionState((prev) =>
                            Object.values({
                                ...prev,
                                [index]:
                                    refs[index].chart.animation.current.playbackRate > 0
                                        ? ENTERED_STATE
                                        : EXITED_STATE,
                            }),
                        );
                    };

                    refs[index].chart.animation.current = animation;
                    refs[index].chart.body.current = node;
                    setTimeout(
                        () => refs[index].chart.body.current.style.setProperty('display', 'unset'),
                        300,
                    );
                }
            };
        });
    }, [refs]);

    const triggerAnimation = (index) => {
        setChartsTransitionState((prev) =>
            Object.values({
                ...prev,
                [index]: animationTriggers[index] ? ENTERING_STATE : EXITING_STATE,
            }),
        );
        translateCells(index);
        refs[index].chart.animation.current.playbackRate = animationTriggers[index] ? 1 : -1;
        refs[index].chart.animation.current.play();
    };

    // enter on render
    useEffect(() => {
        let index = 0;
        for (let trigger of animationTriggers) {
            if (trigger) triggerAnimation(index);
            index++;
        }
    }, []);

    useDidUpdate(() => {
        let index = 0;
        for (let trigger of animationTriggers) {
            if (prevOnOffAnimationTriggers[index] !== trigger) {
                triggerAnimation(index);
            }
            index++;
        }
    }, [animationTriggers.join('-')]);

    // setup ripples
    const ripples = useMemo(() => charts.map(() => createRef()), []);
    const [rippleStyle, setRippleStyle] = useState({});
    const onChartTitleClick = (index) => (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        toggleChart(index);
        setRippleStyle({
            left: `${e.clientX - rect.left}px`,
            top: `${e.clientY - rect.top}px`,
        });
        ripples[index].current.animate(
            [
                { opacity: 1, transform: 'scale(0)' },
                { opacity: 0, transform: 'scale(5)' },
            ],
            { duration: 1000, easing: 'ease' },
        );
    };

    const ref = useRef(null);

    // onStateChange
    useEffect(() => {
        onTransitionStateChange(chartsTransitionState.join());
    }, [chartsTransitionState.join()]);

    return (
        <div className={styles.chartsGrid} ref={ref}>
            {charts.map((chartProps, index) => {
                const {
                    chart: { cell },
                } = refs[index];
                return (
                    <div
                        className={`${styles.cell} ${
                            isExpandingOrExpanded(chartsTransitionState[index])
                                ? styles.expanded
                                : ''
                        } ${cellsRowNumbers[index] === lastRowIndex ? styles.lastRow : ''}`}
                        key={index}
                        ref={cell}
                        style={{ transform: `translateY(${cellTranslateYs[index]}px)` }}
                    >
                        <h2 className={styles.chartTitle} onClick={onChartTitleClick(index)}>
                            <span
                                className={styles.ripple}
                                style={rippleStyle}
                                ref={ripples[index]}
                            />
                            <span className={styles.titleText}>{chartProps.title}</span>
                            <FiChevronDown className={styles.chevron} />
                        </h2>
                        <div
                            className={`${styles.chartWrapper} ${
                                cellsRowNumbers[index] === lastRowIndex ? styles.lastRow : ''
                            }`}
                            ref={setupRefs[index]}
                        >
                            {chartsTransitionState[index] === ENTERED_STATE && (
                                <HorizontalBarChart
                                    {...chartProps}
                                    ref={refs[index].chart}
                                    enterExitTrigger={barsEnterAnimation[index]}
                                    onExited={() => onBarExited(index)}
                                />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ChartsGrid;
