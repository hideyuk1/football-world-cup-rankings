import knex from 'database/config';

export const allTimeTopGoalScorers = knex
    .select('player_id', { name: 'short_name' })
    .count('*', { as: 'value' })
    .from('goal')
    .leftJoin('player', 'goal.player_id', 'player.id')
    .whereNotNull('player_id')
    .groupBy('player_id')
    .having('value', '>', 9)
    .orderBy('value', 'desc');

export const mostAppearancesAsCaptain = knex
    .select('player_id', 'short_name as name')
    .count('*', { as: 'value' })
    .from('player_appearance')
    .leftJoin('player', 'player.id', 'player_id')
    .where('captain', 'true')
    .groupBy('player_id')
    .orderBy('value', 'desc');

export const mostAppearancesAsStarter = knex
    .select('player_id', 'short_name as name')
    .count('*', { as: 'value' })
    .from('player_appearance')
    .leftJoin('player', 'player.id', 'player_id')
    .where('status', 1)
    .groupBy('player_id')
    .orderBy('value', 'desc');
// .limit('10')

export const mostSubbedOn = knex
    .select('player.id as player_id', 'short_name as name')
    .count('*', { as: 'value' })
    .from('substitution')
    .leftJoin('player', 'player.id', 'on_player_id')
    .whereNotNull('id')
    .groupBy('player_id')
    .orderBy('value', 'desc');

export const mostAppearances = knex
    .select(
        'most_appearances_as_starter.player_id',
        'most_appearances_as_starter.name',
        knex.raw('most_appearances_as_starter.value + ifnull(most_subbed_on.value, 0) as value'),
    )
    .from(mostAppearancesAsStarter.as('most_appearances_as_starter').clone())
    .leftJoin(
        mostSubbedOn.as('most_subbed_on').clone(),
        'most_appearances_as_starter.player_id',
        'most_subbed_on.player_id',
    )
    .orderBy('value', 'desc');

export const mostSubbedOff = knex
    .select('player.id as player_id', 'short_name as name')
    .count('*', { as: 'value' })
    .from('substitution')
    .leftJoin('player', 'player.id', 'off_player_id')
    .whereNotNull('id')
    .groupBy('player_id')
    .orderBy('value', 'desc')
    .as('most_subbed_off');
