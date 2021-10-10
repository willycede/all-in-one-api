
exports.up = function(knex) {
    return knex.schema.createTable('products_price_history', function(t) {
        t.increments('id').unsigned().primary();
        t.integer('product_id').notNull();
        t.integer('product_type').notNull();;//1 product 2 modifier
        t.decimal('before_price',10,4).nullable();
        t.decimal('next_price',10,4).nullable();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
        t.timestamp('deleted_at').nullable(knex.fn.now());
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('products_price_history');
};
