
exports.up = function(knex) {
    return knex.schema.createTable('users', function(t) {
        t.increments('id').unsigned().primary();
        t.integer('rol_id').unsigned().notNull();
        t.integer('city_id').unsigned().notNull();
        t.integer('company_id').nullable();
        t.integer('user_type_id').notNull();//can be 1 to users that will by using sistem, 2 for administrative users
        t.string('first_name',150).notNull();
        t.string('second_name', 150).notNull();
        t.string('first_last_name',150).notNull();
        t.string('second_last_name', 150).notNull();
        t.string('email', 200).notNull();
        t.string('password', 200).notNull();
        t.text('access_token', 200).notNull();
        t.string('cellphone_number', 30).notNull();
        t.string('address', 250).nullable();
        t.string('identification_number', 50).notNull();
        t.integer('status').notNull();
        t.string('token_expires_in').notNull();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
        t.timestamp('deleted_at').nullable(knex.fn.now()); 
        t.foreign('rol_id').references('roles.id')
        t.foreign('city_id').references('cities.id')
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('users');
};
