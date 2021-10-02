// Update with your config settings.
require('dotenv').config()


const config= {
    client: 'mysql2',
    useNullAsDefault: true,
    connection:{
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dateStrings: true
    },
    pool:{
      min: 2,
      max: 10
    },
    migrations: {
      directory: './app/db/migrations',
      tableName: 'migrations'
    },
    seeds: {
      directory: './app/db/seeds'
    }
  }
  module.exports = config;
