
exports.up = function(knex) {
    return knex.schema.createTable('categories', function(t) {
        t.increments('id').unsigned().primary();
        t.integer('company_id').unsigned().notNull();
        t.string('name',255).nullable();
        t.string('description',255).nullable();
        t.integer('status').notNull();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
        t.timestamp('deleted_at').nullable(knex.fn.now()); 
        t.foreign('company_id').references('companies.id');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('categories');
};
