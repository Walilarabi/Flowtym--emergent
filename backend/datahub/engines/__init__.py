"""
Flowtym Data Hub - Engines Package

This package contains the core processing engines:
- Normalization: Transform external data to universal format
- Priority: Resolve conflicts between multiple sources (Phase 2)
- Quality: Validate and score data quality (Phase 2)
- Cache: Smart caching for performance (Phase 2)
"""

from .normalization import (
    NormalizationEngine,
    get_normalization_engine,
    FieldMapping,
    SourceMapping,
    transform_date,
    transform_datetime,
    transform_phone,
    transform_email,
    transform_price,
    transform_country,
    transform_language,
)

__all__ = [
    "NormalizationEngine",
    "get_normalization_engine",
    "FieldMapping",
    "SourceMapping",
    "transform_date",
    "transform_datetime",
    "transform_phone",
    "transform_email",
    "transform_price",
    "transform_country",
    "transform_language",
]
