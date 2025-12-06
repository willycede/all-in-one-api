
exports.up = function(knex) {
    return knex.schema.createTable('cart_detail_documents', function(t) {
        t.increments('id').primary();
        t.integer('cart_detail_id').notNull().comment('FK to shopping_car_details.id_details');
        t.string('document_type', 100).notNull().comment('Type of document (identification, vote_certificate, work, etc.)');
        t.string('document_url', 500).notNull().comment('URL or path to the uploaded document');
        t.string('file_name', 255).notNull();
        t.integer('file_size').nullable().comment('File size in bytes');
        t.string('mime_type', 100).nullable();
        t.integer('status').notNull().defaultTo(1).comment('1=active, 0=inactive');
        t.boolean('verified').defaultTo(false).comment('false=pending, true=verified');
        t.integer('verified_by').nullable();
        t.timestamp('verified_at').nullable();
        t.text('notes').nullable();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
        t.timestamp('deleted_at').nullable();
        
        t.foreign('cart_detail_id').references('shopping_car_details.id_details');
        
        t.index(['cart_detail_id'], 'idx_cart_detail');
        t.index('document_type', 'idx_document_type');
        t.index('status', 'idx_status');
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('cart_detail_documents');
};
