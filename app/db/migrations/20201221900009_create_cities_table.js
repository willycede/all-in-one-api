
exports.up = function(knex) {
    return knex.schema.createTable('cities', function(t) {
        t.increments('id').unsigned().primary();
        t.string('name',255).nullable();
        t.integer('state_id').unsigned().notNull();
        t.string('state_code',255).nullable();
        t.integer('country_id').nullable();
        t.string('country_code',2).nullable();
        t.decimal('latitude', 10,8).nullable();
        t.decimal('longitude', 10,8).nullable();
        t.integer('flag').notNull();
        t.string('wikiDataId',255).nullable();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
        t.timestamp('deleted_at').nullable(knex.fn.now()); 
        t.foreign('state_id').references('states.id')
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('cities');
};
