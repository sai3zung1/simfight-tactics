/**
 * Identifies one participant within a single running simulation — meaningless
 * outside of it. Unlike the catalog ids in domain/primitives (which exist
 * whether or not any combat is running), this is a runtime-only concept, so
 * it lives in the engine rather than the domain layer.
 */
export type CombatantId = string & { readonly __brand: "CombatantId" };
