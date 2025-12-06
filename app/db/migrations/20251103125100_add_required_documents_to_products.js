
exports.up = function(knex) {
    return knex.schema.table('products', function(t) {
        t.string('required_documents', 500).nullable().comment('Comma-separated list of required document types');
    });
};

exports.down = function(knex) {
    return knex.schema.table('products', function(t) {
        t.dropColumn('required_documents');
    });
};
