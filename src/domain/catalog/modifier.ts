/**
 * Opaque slot for modifier definitions. The actual shape — discriminated
 * union, fields, composition rules — is derived from cdragon observation
 * at step 5 (PROJECT_CONTEXT §10). Until then, this placeholder lets
 * entities declare an `effects: Modifier[]` slot without committing to
 * internal structure.
 */
export type Modifier = {
  readonly __kind: "TODO_STEP_5";
};
