/**
 * Type casting utilities for Supabase API calls
 * This file contains utilities to handle TypeScript type casting issues with Supabase
 */

/**
 * Cast string to supabase column type (workaround for strict typing)
 */
export const castToColumn = (value: string): any => value as any;

/**
 * Cast object to supabase insert type (workaround for strict typing)
 */
export const castToInsert = (obj: Record<string, any>): any => obj as any;

/**
 * Cast object to supabase update type (workaround for strict typing)
 */
export const castToUpdate = (obj: Record<string, any>): any => obj as any;

/**
 * Cast supabase result to expected type (workaround for strict typing)
 */
export const castFromSupabase = <T>(obj: any): T => obj as unknown as T;
