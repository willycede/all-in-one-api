
exports.up = function(knex) {
    return knex.schema.createTable('product_images', function(t) {
        t.increments('id').unsigned().primary();
        t.integer('product_id').unsigned().notNull();
        t.string('image_url',255).nullable();
        t.integer('status').notNull();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
        t.timestamp('deleted_at').nullable(knex.fn.now());
        t.foreign('product_id').references('products.id');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('product_images');
};