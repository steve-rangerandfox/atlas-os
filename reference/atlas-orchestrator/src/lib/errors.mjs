export class OrchestratorError extends Error {
  constructor(message, code = "ORCHESTRATOR_ERROR", details = undefined) {
    super(message);
    this.name = "OrchestratorError";
    this.code = code;
    this.details = details;
  }
}

export function asErrorDetails(error) {
  if (error instanceof OrchestratorError) {
    return {
      error: error.code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details })
    };
  }
  return {
    error: "INTERNAL_ERROR",
    message: error instanceof Error ? error.message : String(error)
  };
}
