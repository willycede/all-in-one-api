
exports.up = async function(knex) {
    await knex.schema.createTable('legal_documents', function(t) {
        t.increments('id').primary();
        t.string('document_key', 100).notNull().comment('Logical key, e.g. data_treatment_policy, data_treatment_consent');
        t.string('version', 20).notNull().comment('Version string, e.g. v1, v2');
        t.string('title', 255).notNull();
        t.string('file_path', 500).notNull().comment('Public path served by the API, e.g. /legal/v1/politica-tratamiento-datos.pdf');
        t.boolean('is_active').notNull().defaultTo(true).comment('Whether this is the version currently shown to new users');
        t.boolean('is_required').notNull().defaultTo(true).comment('Whether acceptance is mandatory at registration');
        t.timestamp('published_at').defaultTo(knex.fn.now());
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());

        t.unique(['document_key', 'version'], 'uq_legal_documents_key_version');
        t.index(['document_key', 'is_active'], 'idx_legal_documents_key_active');
    });

    await knex.schema.createTable('user_consents', function(t) {
        t.increments('id').primary();
        t.integer('id_users').notNull().comment('FK to users.id_users');
        t.string('document_key', 100).notNull();
        t.string('version', 20).notNull();
        t.timestamp('accepted_at').notNull().defaultTo(knex.fn.now());
        t.string('ip', 45).nullable().comment('IPv4 or IPv6 of the accepting client');
        t.text('user_agent').nullable();
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());

        t.foreign('id_users').references('users.id_users');
        t.index(['id_users', 'document_key'], 'idx_user_consents_user_doc');
    });
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('user_consents');
    await knex.schema.dropTableIfExists('legal_documents');
};
