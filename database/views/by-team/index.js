import knex from 'database/config';

// goal type
// 1 - penalty
// 2 - common
// 3 - own

export const allTimeTopGoalScorers = knex
    .select('team.name')
    .count('*', { as: 'value' })
    .from('goal')
    .whereIn('goal.type', [1, 2, 3])
    .leftJoin('team', 'goal.team_id', 'team.id')
    .groupBy('team.id')
    .orderBy('value', 'desc');

// result type
// 1 - common
// 2 - pen
// 3 - extra time
// 8 - golden goal

export const allTimeMatchesWon = knex
    .select('team.name')
    .count('*', { as: 'value' })
    .from('match')
    .whereIn('result_type', [1, 3, 8])
    .leftJoin('team', 'match.winner_team_id', 'team.id')
    .whereNotNull('name')
    .groupBy('team.id')
    .orderBy('value', 'desc');
