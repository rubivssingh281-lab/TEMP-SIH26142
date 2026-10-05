"""Replaceable service providers for the processing pipeline.

Production integrations replace these provider functions without changing routes
or orchestration logic.
"""

from importlib import import_module
from typing import Callable, cast

from app.services.inference import InferenceService, MockInferenceService
from app.services.preprocessing import MockPreprocessingService, PreprocessingService, RasterioPreprocessingService
from app.services.validation import MockValidationService, ValidationService
from app.core.config import settings


_preprocessing_service = RasterioPreprocessingService() if settings.USE_REAL_GEOSPATIAL else MockPreprocessingService()
_inference_service = MockInferenceService()
_validation_service = MockValidationService()
_inference_factory_service: InferenceService | None = None


def get_preprocessing_service() -> PreprocessingService:
    return _preprocessing_service


def get_inference_service() -> InferenceService:
    global _inference_factory_service
    if settings.INFERENCE_BACKEND == "mock":
        return _inference_service
    if _inference_factory_service is None:
        if not settings.INFERENCE_FACTORY:
            raise RuntimeError("inference_not_configured")
        module_name, factory_name = settings.INFERENCE_FACTORY.rsplit(":", 1)
        factory_module = import_module(module_name)
        factory = cast(Callable[[], InferenceService], getattr(factory_module, factory_name))
        _inference_factory_service = factory()
    return _inference_factory_service


def get_validation_service() -> ValidationService:
    return _validation_service
