
exports.up = function(knex) {
    return knex.schema.createTable('companies', function(t) {
        t.increments('id').unsigned().primary();
        t.string('name',255).nullable();
        t.string('description',255).nullable();
        t.string('ruc',13).nullable();
        t.string('website',13).nullable();
        t.string('contact_name',250);
        t.string('contact_cellphone_number',11);
        t.string('enterprise_cellphone_number',15);
        t.integer('status').notNull();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
        t.timestamp('deleted_at').nullable(knex.fn.now()); 
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('companies');
};
