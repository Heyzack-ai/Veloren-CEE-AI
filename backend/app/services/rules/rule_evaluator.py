"""Rule Evaluator Service."""
import re
from datetime import datetime, timedelta
from typing import Any, Callable, Optional
from dataclasses import dataclass

from app.models.validation_rule import ValidationRule


@dataclass
class RuleResult:
    """Rule evaluation result."""
    rule_id: str
    passed: bool
    status: str  # 'passed', 'warning', 'error'
    message: Optional[str] = None


class RuleEvaluator:
    """Evaluates validation rules against extracted data."""

    def __init__(self):
        self.functions: dict[str, Callable] = {}
        self._register_builtin_functions()

    def _register_builtin_functions(self):
        """Register built-in validation functions."""
        # Date functions
        self.functions["DAYS_BETWEEN"] = lambda d1, d2: abs((d2 - d1).days) if isinstance(d1, datetime) and isinstance(d2, datetime) else 0
        self.functions["DATE_ADD"] = lambda d, days: d + timedelta(days=days) if isinstance(d, datetime) else d

        # String functions
        self.functions["CONTAINS"] = lambda s, sub: sub.lower() in s.lower() if s and sub else False
        self.functions["MATCHES"] = lambda s, pattern: bool(re.match(pattern, s)) if s else False

        # Numeric functions
        self.functions["ABS"] = abs
        self.functions["ROUND"] = lambda n, decimals=0: round(n, decimals)

        # CEE-specific functions
        self.functions["VALIDATE_SIRET"] = self._validate_siret
        self.functions["CALCULATE_CEE_PREMIUM"] = self._calculate_cee_premium

    def _validate_siret(self, siret: str) -> bool:
        """Validate French SIRET number using Luhn algorithm."""
        if not siret or len(siret) != 14:
            return False

        total = 0
        for i, char in enumerate(siret):
            if not char.isdigit():
                return False
            digit = int(char)
            if i % 2 == 0:
                digit *= 2
            if digit > 9:
                digit -= 9
            total += digit

        return total % 10 == 0

    def _calculate_cee_premium(
        self,
        operation_code: str,
        climate_zone: str,
        surface: float,
        precarity_status: str
    ) -> float:
        """Calculate CEE premium based on operation parameters."""
        # TODO: Implement actual CEE premium calculation
        return 0.0

    async def evaluate(
        self,
        rule: ValidationRule,
        context: dict[str, Any]
    ) -> RuleResult:
        """Evaluate a rule against the provided context."""
        try:
            # TODO: Implement full expression parsing and evaluation
            # For now, return a placeholder result
            result = True  # Placeholder
            
            return RuleResult(
                rule_id=str(rule.id),
                passed=result,
                status="passed" if result else ("warning" if rule.severity == "warning" else "error"),
                message=None if result else rule.error_message
            )
        except Exception as e:
            return RuleResult(
                rule_id=str(rule.id),
                passed=False,
                status="error",
                message=f"Rule evaluation error: {str(e)}"
            )

