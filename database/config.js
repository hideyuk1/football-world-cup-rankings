const dbConfig = {
    client: 'sqlite3',
    connection: {
        filename: 'database/db.db',
    },
};

const knex = require('knex')(dbConfig);

export default knex;
