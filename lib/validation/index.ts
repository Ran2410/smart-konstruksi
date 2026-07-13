// ============================================================
// Smart Konstruksi — Validation Helpers
// ============================================================
import { ZodSchema } from "zod/v4";

export interface ValidationResult<T> {
  success: true;
  data: T;
}

export interface ValidationErrorOutcome {
  success: false;
  errors: { field: string; message: string }[];
}

export type ValidationOutcome<T> = ValidationResult<T> | ValidationErrorOutcome;

/**
 * Validate request body against a Zod schema.
 * Returns parsed data or structured error response.
 */
export function validateBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): ValidationOutcome<T> {
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data as T };
  }

  // Zod v4: error is on result.error
  const zodError = (result as { success: false; error: unknown }).error as {
    issues?: Array<{ path: (string | number)[]; message: string }>;
  };

  const errors = (zodError.issues || []).map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));

  return { success: false, errors };
}

/**
 * Create a 400 response from validation errors
 */
export function validationErrorResponse(
  errors: { field: string; message: string }[]
): Response {
  return Response.json(
    {
      error: "Validation Error",
      message: "Request validation failed",
      details: errors,
    },
    { status: 400 }
  );
}

/**
 * Validate and return parsed data or a Response error.
 * Usage: const data = validateOrRespond(schema, body); if (data instanceof Response) return data;
 */
export function validateOrRespond<T>(
  schema: ZodSchema<T>,
  body: unknown
): T | Response {
  const result = validateBody(schema, body);
  if (result.success === false) {
    return validationErrorResponse(result.errors);
  }
  return result.data;
}
