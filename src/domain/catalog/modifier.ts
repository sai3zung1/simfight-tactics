/**
 * Opaque slot for modifier definitions. The actual shape — discriminated
 * union, fields, composition rules — is derived from observed cdragon data,
 * not postulated. Until then, this placeholder lets
 * entities declare an `effects: Modifier[]` slot without committing to
 * internal structure.
 */
export type Modifier = {
  readonly __kind: "TODO_STEP_5";
};
