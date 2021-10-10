
exports.up = function(knex) {
    return knex.schema.createTable('states', function(t) {
        t.increments('id').unsigned().primary();
        t.string('name',255).nullable();
        t.string('country_id').unsigned().nullable();
        t.string('country_code',2).nullable();
        t.string('fips_code',255).nullable();
        t.string('iso2',255).nullable();
        t.decimal('latitude', 10,8).nullable();
        t.decimal('longitude', 10,8).nullable();
        t.integer('flag').notNull();
        t.string('wikiDataId',255).nullable();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
        t.timestamp('deleted_at').nullable(knex.fn.now()); 
        t.foreign('country_id').references('countries.id')
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('states');
};
