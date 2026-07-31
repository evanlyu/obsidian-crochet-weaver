const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/;
const RESERVED_PROGRESS_IDS = new Set([
	'__proto__',
	'prototype',
	'constructor',
	'toString',
	'valueOf',
]);

export function isSafeProgressId(id: string): boolean {
	return SAFE_ID_PATTERN.test(id) && !RESERVED_PROGRESS_IDS.has(id);
}

export function progressIdFromConfig(explicitId: string | undefined, source: string): string {
	const trimmed = explicitId?.trim() ?? '';
	return isSafeProgressId(trimmed) ? trimmed : `auto-${hash(source)}`;
}

function hash(text: string): string {
	let h = 5381;
	for (let i = 0; i < text.length; i++) {
		h = (((h << 5) + h) ^ text.charCodeAt(i)) | 0;
	}
	return (h >>> 0).toString(36);
}
