
exports.up = function(knex) {
    return knex.schema.createTable('users', function(t) {
        t.increments('id').unsigned().primary();
        t.integer('rol_id').unsigned().notNull();
        t.integer('company_id').unsigned().notNull();
        t.string('first_name',150).notNull();
        t.string('second_name', 150).notNull();
        t.string('first_last_name',150).notNull();
        t.string('second_last_name', 150).notNull();
        t.string('email', 200).notNull();
        t.string('password', 200).notNull();
        t.text('access_token', 200).notNull();
        t.string('cellphone_number', 30).notNull();
        t.string('secondary_cellphone_number', 30).nullable();
        t.string('address', 250).nullable();
        t.string('identification_number', 50).notNull();
        t.integer('status').notNull();
        t.string('token_expires_in').notNull();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
        t.timestamp('deleted_at').nullable(knex.fn.now()); 
        t.foreign('rol_id').references('roles.id')
        t.foreign('company_id').references('companies.id')
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('users');
};
