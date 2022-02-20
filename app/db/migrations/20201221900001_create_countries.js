
exports.up = function(knex) {
    return knex.schema.createTable('countries', function(t) {
        t.increments('id').unsigned().primary();
        t.string('name',150).nullable();
        t.string('iso3',3).nullable();
        t.string('iso2',2).nullable();
        t.string('phonecode', 255).nullable();
        t.string('capital', 255).nullable();
        t.string('currency', 255).nullable();
        t.string('currency_symbol', 255).nullable();
        t.string('tld', 255).nullable();
        t.string('native', 255).nullable();
        t.string('region', 255).nullable();
        t.string('subregion', 255).nullable();
        t.string('timezones', 255).nullable();
        t.string('translations', 255).nullable();
        t.decimal('latitude', 10,8).nullable();
        t.decimal('longitude', 10,8).nullable();
        t.string('emoji', 250).nullable();
        t.string('emojiU', 250).nullable();
        t.integer('flag').nullable();
        t.string('wikiDataId', 255).nullable();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
        t.timestamp('deleted_at').nullable(knex.fn.now()); 
    });
};

exports.down = function(knex) {
    return knex.schema.dropTable('countries');
};
