
exports.up = function(knex) {
    return knex.schema.createTable('products', function(t) {
        t.increments('id').unsigned().primary();
        t.integer('category_id').unsigned().notNull();
        t.integer('brand_id').unsigned().notNull();
        t.string('name',255).nullable();
        t.string('description',255).nullable();
        t.string('image_url',255).nullable();
        t.decimal('price', 10,4);
        t.integer('status').notNull();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
        t.timestamp('deleted_at').nullable(knex.fn.now());
        t.foreign('category_id').references('categories.id');
        t.foreign('brand_id').references('brands.id');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('products');
};
