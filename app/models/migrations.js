const db  = require("../db/knex");


const testDB = async () => {
    return db
      .select()
      .from('migrations')
      .then(()=>{
          console.log("Database connected successfully")
      })
      .catch((error) => {
          console.log(error)
        console.log('Error establishing a database connection');
      });
  };

  module.exports = { testDB };