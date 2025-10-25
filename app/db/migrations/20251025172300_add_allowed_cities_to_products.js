
exports.up = function(knex) {
    return knex.schema.table('products', function(t) {
        t.string('allowed_cities', 255).nullable();
    });
};

exports.down = function(knex) {
    return knex.schema.table('products', function(t) {
        t.dropColumn('allowed_cities');
    });
};
