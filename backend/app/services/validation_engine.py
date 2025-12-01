"""Validation rules engine."""
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.rule import Rule
from app.models.submission import Submission, SubmissionStatus
from app.models.extracted_data import ExtractedData
from app.models.rule_result import RuleResult


class ValidationEngine:
    """Service for executing validation rules."""
    
    async def run_validation(
        self,
        db: AsyncSession,
        submission_id: int,
        rule_ids: List[int] | None = None
    ) -> Dict[str, Any]:
        """
        Run validation rules on extracted data.
        
        Args:
            db: Database session
            submission_id: Submission ID
            rule_ids: Optional list of specific rule IDs to run
            
        Returns:
            Dictionary with validation results
        """
        # Get submission
        submission_result = await db.execute(
            select(Submission).where(Submission.id == submission_id)
        )
        submission = submission_result.scalar_one_or_none()
        
        if not submission:
            raise ValueError(f"Submission {submission_id} not found")
        
        # Get extracted data
        extracted_result = await db.execute(
            select(ExtractedData).where(
                ExtractedData.submission_id == submission_id
            )
        )
        extracted_data_list = extracted_result.scalars().all()
        
        if not extracted_data_list:
            raise ValueError(f"No extracted data found for submission {submission_id}")
        
        # Get rules to execute
        if rule_ids:
            rules_result = await db.execute(
                select(Rule).where(
                    Rule.id.in_(rule_ids),
                    Rule.document_type_id == submission.document_type_id,
                    Rule.is_active == True
                )
            )
        else:
            # Get all active rules for document type
            rules_result = await db.execute(
                select(Rule).where(
                    Rule.document_type_id == submission.document_type_id,
                    Rule.is_active == True
                )
            )
        
        rules = rules_result.scalars().all()
        
        if not rules:
            return {
                "submission_id": submission_id,
                "results": [],
                "all_passed": True,
                "message": "No validation rules found"
            }
        
        # Update submission status
        submission.status = SubmissionStatus.VALIDATING
        await db.commit()
        
        # Combine all extracted data
        combined_data = {}
        for extracted in extracted_data_list:
            if isinstance(extracted.extracted_data, dict):
                combined_data.update(extracted.extracted_data)
        
        # Execute each rule
        results = []
        all_passed = True
        
        for rule in rules:
            result = await self._execute_rule(
                db,
                submission_id,
                rule,
                combined_data
            )
            results.append(result)
            if not result["passed"]:
                all_passed = False
        
        return {
            "submission_id": submission_id,
            "results": results,
            "all_passed": all_passed
        }
    
    async def _execute_rule(
        self,
        db: AsyncSession,
        submission_id: int,
        rule: Rule,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a single validation rule.
        
        Args:
            db: Database session
            submission_id: Submission ID
            rule: Rule to execute
            data: Extracted data to validate
            
        Returns:
            Dictionary with rule execution result
        """
        rule_config = rule.rule_config
        
        try:
            passed = self._evaluate_rule(rule_config, data)
            error_message = None if passed else "Validation rule failed"
        except Exception as e:
            passed = False
            error_message = str(e)
        
        # Save rule result
        rule_result = RuleResult(
            submission_id=submission_id,
            rule_id=rule.id,
            passed=passed,
            result_data={"rule_name": rule.name},
            error_message=error_message
        )
        db.add(rule_result)
        await db.commit()
        
        return {
            "rule_id": rule.id,
            "rule_name": rule.name,
            "passed": passed,
            "error_message": error_message
        }
    
    def _evaluate_rule(self, rule_config: Dict[str, Any], data: Dict[str, Any]) -> bool:
        """
        Evaluate a rule configuration against data.
        
        Supports operators: eq, ne, gt, gte, lt, lte, in, contains, required
        
        Args:
            rule_config: Rule configuration dictionary
            data: Data to validate
            
        Returns:
            True if rule passes, False otherwise
        """
        if "operator" not in rule_config:
            return True
        
        operator = rule_config["operator"]
        field = rule_config.get("field")
        value = rule_config.get("value")
        
        if field and field not in data:
            if operator == "required":
                return False
            return True  # Field not present and not required
        
        field_value = data.get(field)
        
        if operator == "eq":
            return field_value == value
        elif operator == "ne":
            return field_value != value
        elif operator == "gt":
            return field_value > value
        elif operator == "gte":
            return field_value >= value
        elif operator == "lt":
            return field_value < value
        elif operator == "lte":
            return field_value <= value
        elif operator == "in":
            return field_value in value if isinstance(value, list) else False
        elif operator == "contains":
            return value in str(field_value) if field_value else False
        elif operator == "required":
            return field_value is not None and field_value != ""
        elif operator == "and":
            # Logical AND - all conditions must pass
            conditions = rule_config.get("conditions", [])
            return all(self._evaluate_rule(cond, data) for cond in conditions)
        elif operator == "or":
            # Logical OR - at least one condition must pass
            conditions = rule_config.get("conditions", [])
            return any(self._evaluate_rule(cond, data) for cond in conditions)
        else:
            return True  # Unknown operator, pass by default


validation_engine = ValidationEngine()

