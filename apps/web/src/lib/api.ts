import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/** Convert BigInt values to strings for JSON serialization */
function serializeBigInt(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(serializeBigInt);
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = serializeBigInt(v);
    }
    return result;
  }
  return value;
}

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ data: serializeBigInt(data) }, { status });
}

export function error(code: string, message?: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function handleZodError(err: ZodError) {
  return error(
    'VALIDATION_ERROR',
    err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
    400,
  );
}

export function serverError(err: unknown) {
  console.error('[API]', err);
  return error('INTERNAL_ERROR', undefined, 500);
}
