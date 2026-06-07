const knex = require('../db/knex');
const { processInvoiceAfterPayment } = require('../models/order_invoice');
const { getEffectiveBillingConfig } = require('../models/billingSettings');
const { notifyAdminInvoiceFailureBatch } = require('../helpers/invoiceAdminAlerts');

const PAID_STATUS = 3;
const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;
const DEFAULT_BATCH_SIZE = 5;
const DEFAULT_MIN_AGE_MS = 5 * 60 * 1000;

let timer = null;
let isRunning = false;

const parsePositiveInt = (value, fallback) => {
	const parsed = parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const findRetryCandidates = async (batchSize, minAgeMs) => {
	const cutoff = new Date(Date.now() - minAgeMs);

	return knex('shopping_car')
		.select('id_shopping_car')
		.where({ status: PAID_STATUS })
		.where(function wherePendingInvoice() {
			this.where('status_invoice', 0)
				.orWhereNull('status_invoice')
				.orWhereNotNull('invoice_error');
		})
		.where(function whereNotAlreadyInvoiced() {
			this.whereNull('invoice_access_key')
				.orWhere('invoice_access_key', '');
		})
		.where('updated_at', '<=', cutoff)
		.orderBy('updated_at', 'asc')
		.limit(batchSize);
};

const runInvoiceRetryBatch = async () => {
	if (isRunning) {
		return { skipped: true, reason: 'already_running' };
	}

	isRunning = true;
	const batchSize = parsePositiveInt(process.env.INVOICE_RETRY_BATCH_SIZE, DEFAULT_BATCH_SIZE);
	const minAgeMs = parsePositiveInt(process.env.INVOICE_RETRY_MIN_AGE_MS, DEFAULT_MIN_AGE_MS);

	const summary = {
		processed: 0,
		succeeded: 0,
		failed: 0,
		skipped: 0,
		errors: [],
	};

	try {
		const config = await getEffectiveBillingConfig();
		if (!config.is_billing_enabled) {
			return { ...summary, skipped: true, reason: 'billing_disabled' };
		}

		const candidates = await findRetryCandidates(batchSize, minAgeMs);

		for (const row of candidates) {
			summary.processed += 1;
			try {
				const result = await processInvoiceAfterPayment(row.id_shopping_car);
				if (result && result.success) {
					summary.succeeded += 1;
				} else if (result && result.skipped) {
					summary.skipped += 1;
				} else {
					summary.failed += 1;
				}
			} catch (error) {
				summary.failed += 1;
				summary.errors.push({
					orderId: row.id_shopping_car,
					message: error.message,
				});
			}
		}

		if (summary.processed > 0) {
			console.log('[invoice-retry]', JSON.stringify(summary));
		}

		if (summary.errors.length > 0) {
			try {
				await notifyAdminInvoiceFailureBatch(summary.errors);
			} catch (alertError) {
				console.error('[invoice-retry] Error enviando alerta admin:', alertError.message);
			}
		}

		return summary;
	} finally {
		isRunning = false;
	}
};

const startInvoiceRetryJob = () => {
	const enabled = String(process.env.INVOICE_RETRY_ENABLED || 'true').toLowerCase() !== 'false';
	if (!enabled) {
		console.log('[invoice-retry] Job desactivado (INVOICE_RETRY_ENABLED=false)');
		return;
	}

	const intervalMs = parsePositiveInt(process.env.INVOICE_RETRY_INTERVAL_MS, DEFAULT_INTERVAL_MS);

	runInvoiceRetryBatch().catch((error) => {
		console.error('[invoice-retry] Error en ejecución inicial:', error.message);
	});

	timer = setInterval(() => {
		runInvoiceRetryBatch().catch((error) => {
			console.error('[invoice-retry] Error en ejecución programada:', error.message);
		});
	}, intervalMs);

	if (typeof timer.unref === 'function') {
		timer.unref();
	}

	console.log(`[invoice-retry] Job activo cada ${Math.round(intervalMs / 60000)} min`);
};

const stopInvoiceRetryJob = () => {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
};

module.exports = {
	startInvoiceRetryJob,
	stopInvoiceRetryJob,
	runInvoiceRetryBatch,
};
