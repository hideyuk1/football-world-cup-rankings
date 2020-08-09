import knex from 'database/config';

export const allTimeTopGoalScorers = knex
    .select({ name: 'team_name' })
    .count('*', { as: 'value' })
    .from('goal')
    .leftJoin('team', 'goal.team_id', 'team.id')
    .groupBy('team.id')
    .orderBy('value', 'desc');
