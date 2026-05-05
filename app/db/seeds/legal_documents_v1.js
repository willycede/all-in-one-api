
exports.seed = async function(knex) {
    const docs = [
        {
            document_key: 'data_treatment_policy',
            version: 'v1',
            title: 'Política de Tratamiento de Datos Personales - All in One C S.A.',
            file_path: '/legal/v1/politica-tratamiento-datos.pdf',
            is_active: true,
            is_required: true,
        },
        {
            document_key: 'data_treatment_consent',
            version: 'v1',
            title: 'Consentimiento para el Tratamiento de Datos Personales - All in One C S.A.',
            file_path: '/legal/v1/consentimiento-tratamiento-datos.pdf',
            is_active: true,
            is_required: true,
        },
    ];

    for (const doc of docs) {
        const existing = await knex('legal_documents')
            .where({ document_key: doc.document_key, version: doc.version })
            .first();
        if (!existing) {
            await knex('legal_documents').insert(doc);
        }
    }
};
