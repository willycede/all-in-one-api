
exports.up = function(knex) {
    return knex.schema.createTable('product_user_documents', function(t) {
        t.increments('id').unsigned().primary();
        t.integer('user_id').unsigned().notNull();
        t.integer('product_id').unsigned().notNull();
        t.string('document_type', 100).notNull().comment('Type of document (identification, vote_certificate, work, etc.)');
        t.string('document_url', 500).notNull().comment('URL or path to the uploaded document');
        t.string('file_name', 255).notNull();
        t.integer('file_size').nullable().comment('File size in bytes');
        t.string('mime_type', 100).nullable();
        t.integer('status').notNull().defaultTo(1).comment('1=active, 0=inactive');
        t.boolean('verified').defaultTo(false).comment('false=pending, true=verified');
        t.integer('verified_by').unsigned().nullable();
        t.timestamp('verified_at').nullable();
        t.text('notes').nullable();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
        t.timestamp('deleted_at').nullable();
        
        t.foreign('user_id').references('users.id');
        t.foreign('product_id').references('products.id_products');
        
        t.index(['user_id', 'product_id'], 'idx_user_product');
        t.index('document_type', 'idx_document_type');
        t.index('status', 'idx_status');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('product_user_documents');
};
