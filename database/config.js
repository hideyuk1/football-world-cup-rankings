const dbConfig = {
    client: 'sqlite3',
    connection: {
        filename: 'database/worldcup.db',
    },
};

const knex = require('knex')(dbConfig);

export default knex;
