import useDidUpdate from 'hooks/useDidUpdate';
import usePrevious from 'hooks/usePrevious';
import useWindowSize from 'hooks/useWindowSize';
import { createRef, useCallback, useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiGithub } from 'react-icons/fi';
import Header from '../components/Header/Header';
import HorizontalBarChart from '../components/HorizontalBarChart/HorizontalBarChart';
import styles from './index.module.scss';
import Head from 'next/head';

const myDBConfig = {
    client: 'sqlite3',
    connection: {
        filename: 'database/worldcup.db',
    },
};

const knex = require('knex')(myDBConfig);

export async function getStaticProps() {
    // all time goalscorers
    const allTimeTopGoalScorers = knex
        .select('player_id', { name: 'short_name' })
        .count('*', { as: 'value' })
        .from('goal')
        .leftJoin('player', 'goal.player_id', 'player.id')
        .whereNotNull('player_id')
        .groupBy('player_id')
        .having('value', '>', 9)
        .orderBy('value', 'desc');

    const mostAppearancesAsCaptain = knex
        .select('player_id', 'short_name as name')
        .count('*', { as: 'value' })
        .from('player_appearance')
        .leftJoin('player', 'player.id', 'player_id')
        .where('captain', 'true')
        .groupBy('player_id')
        .orderBy('value', 'desc');

    const mostAppearancesAsStarter = knex
        .select('player_id', 'short_name as name')
        .count('*', { as: 'value' })
        .from('player_appearance')
        .leftJoin('player', 'player.id', 'player_id')
        .where('status', 1)
        .groupBy('player_id')
        .orderBy('value', 'desc');
    // .limit('10')

    const mostSubbedOn = knex
        .select('player.id as player_id', 'short_name as name')
        .count('*', { as: 'value' })
        .from('substitution')
        .leftJoin('player', 'player.id', 'on_player_id')
        .whereNotNull('id')
        .groupBy('player_id')
        .orderBy('value', 'desc');

    const mostAppearances = knex
        .select(
            'most_appearances_as_starter.player_id',
            'most_appearances_as_starter.name',
            knex.raw(
                'most_appearances_as_starter.value + ifnull(most_subbed_on.value, 0) as value',
            ),
        )
        .from(mostAppearancesAsStarter.as('most_appearances_as_starter').clone())
        .leftJoin(
            mostSubbedOn.as('most_subbed_on').clone(),
            'most_appearances_as_starter.player_id',
            'most_subbed_on.player_id',
        )
        .orderBy('value', 'desc');

    const mostSubbedOff = knex
        .select('player.id as player_id', 'short_name as name')
        .count('*', { as: 'value' })
        .from('substitution')
        .leftJoin('player', 'player.id', 'off_player_id')
        .whereNotNull('id')
        .groupBy('player_id')
        .orderBy('value', 'desc')
        .as('most_subbed_off');

    return {
        props: {
            allTimeTopGoalScorers: await allTimeTopGoalScorers.limit(10),
            mostAppearancesAsStarter: await mostAppearancesAsStarter.limit(10),
            mostSubbedOn: await mostSubbedOn.limit(10),
            mostAppearances: await mostAppearances.limit(10),
            mostAppearancesAsCaptain: await mostAppearancesAsCaptain.limit(10),
            mostSubbedOff: await mostSubbedOff.limit(10),
        },
    };
}

const ENTERING_STATE = 'ENTERING_STATE';
const ENTERED_STATE = 'ENTERED_STATE';
const EXITING_STATE = 'EXITING_STATE';
const EXITED_STATE = 'EXITED_STATE';

const Home = ({
    allTimeTopGoalScorers,
    mostAppearancesAsStarter,
    mostSubbedOn,
    mostSubbedOff,
    mostAppearances,
    mostAppearancesAsCaptain,
}) => {
    const charts = useMemo(
        () => [
            { data: allTimeTopGoalScorers, title: 'All time top goalscorers' },
            { data: mostAppearances, title: 'Most appearances' },
            { data: mostAppearancesAsCaptain, title: 'Most appearances as captain' },
            {
                data: mostAppearancesAsStarter,
                title: 'Most appearances in starting lineup',
            },
            { data: mostSubbedOn, title: 'Most subbed on' },
            { data: mostSubbedOff, title: 'Most subbed off' },
        ],
        [],
    );

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
    const chartHeight = 600;

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

    return (
        <>
            <Head>
                <title>Football World Cup Rankings</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Header />
            <main className={styles.main}>
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
            </main>
        </>
    );
};

export default Home;
