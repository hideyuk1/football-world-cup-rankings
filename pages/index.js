import * as ByPlayer from 'database/views/by-player';
import * as ByTeam from 'database/views/by-team';
import Head from 'next/head';
import { useMemo, useState } from 'react';
import ChartsGrid from '../components/ChartsGrid/ChartsGrid';
import Header from '../components/Header/Header';
import SwipeableContainer from '../components/SwipeableContainer/SwipeableContainer';
import styles from './index.module.scss';

export async function getStaticProps() {
    return {
        props: {
            byPlayer: {
                allTimeTopGoalScorers: await ByPlayer.allTimeTopGoalScorers.limit(10),
                mostAppearancesAsStarter: await ByPlayer.mostAppearancesAsStarter.limit(10),
                mostSubbedOn: await ByPlayer.mostSubbedOn.limit(10),
                mostAppearances: await ByPlayer.mostAppearances.limit(10),
                mostAppearancesAsCaptain: await ByPlayer.mostAppearancesAsCaptain.limit(10),
                mostSubbedOff: await ByPlayer.mostSubbedOff.limit(10),
            },
            byTeam: {
                allTimeTopGoalScorers: await ByTeam.allTimeTopGoalScorers.limit(10),
            },
        },
    };
}

const Home = ({ byPlayer, byTeam }) => {
    const byPlayerCharts = useMemo(
        () => [
            { data: byPlayer.allTimeTopGoalScorers, title: 'All time top goalscorers' },
            { data: byPlayer.mostAppearances, title: 'Most appearances' },
            { data: byPlayer.mostAppearancesAsCaptain, title: 'Most appearances as captain' },
            {
                data: byPlayer.mostAppearancesAsStarter,
                title: 'Most appearances in starting lineup',
            },
            { data: byPlayer.mostSubbedOn, title: 'Most subbed on' },
            { data: byPlayer.mostSubbedOff, title: 'Most subbed off' },
        ],
        [],
    );
    const byTeamCharts = useMemo(
        () => [{ data: byTeam.allTimeTopGoalScorers, title: 'All time top goalscorers' }],
        [],
    );

    const chartHeight = 600;
    const [slideResizeTrigger, setSlideResizeTrigger] = useState(false);

    const triggerResize = (transitionStates) => {
        if (['ENTERED_STATE', 'EXITED_STATE'].some((state) => transitionStates.includes(state)))
            setSlideResizeTrigger((prev) => !prev);
    };

    return (
        <>
            <Head>
                <title>Football World Cup Rankings</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Header />
            <main className={styles.main}>
                <SwipeableContainer
                    labels={['Players', 'Teams']}
                    resizeTrigger={slideResizeTrigger}
                >
                    <ChartsGrid
                        charts={byPlayerCharts}
                        chartHeight={chartHeight}
                        onTransitionStateChange={triggerResize}
                    />
                    <ChartsGrid
                        charts={byTeamCharts}
                        chartHeight={chartHeight}
                        onTransitionStateChange={triggerResize}
                    />
                </SwipeableContainer>
            </main>
        </>
    );
};

export default Home;
