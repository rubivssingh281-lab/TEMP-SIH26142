from fastapi import HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

class ErrorResponse(BaseModel):
    error_code: str
    message: str
    trace_id: str | None = None

def get_error_response(status_code: int, error_code: str, message: str, trace_id: str | None = None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error_code": error_code, "message": message, "trace_id": trace_id}
    )

class APIError(HTTPException):
    def __init__(self, status_code: int, error_code: str, message: str):
        super().__init__(status_code=status_code, detail={"error_code": error_code, "message": message})
