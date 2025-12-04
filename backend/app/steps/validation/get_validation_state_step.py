"""Get validation state endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.dossier import Dossier
from app.models.document import Document
from app.models.validation_rule import ValidationRule
from app.models.validation_result import ValidationResult
from app.models.extracted_field import ExtractedField
from app.models.field_schema import FieldSchema
from app.models.document_type import DocumentType
from sqlalchemy import select, or_

config = {
    "name": "GetValidationState",
    "type": "api",
    "path": "/api/dossiers/{dossier_id}/validation",
    "method": "GET"
}

async def handler(req, context):
    """Handle get validation state request."""
    headers = req.get("headers", {})
    auth_header = headers.get("authorization") or headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return {
            "status": 401,
            "body": {"detail": "Could not validate credentials"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    token = auth_header.replace("Bearer ", "")
    path_params = req.get("pathParams", {})
    dossier_id_str = path_params.get("dossier_id")
    
    if not dossier_id_str:
        return {"status": 400, "body": {"detail": "dossier_id is required"}}
    
    try:
        dossier_id = UUID(dossier_id_str)
    except ValueError:
        return {"status": 400, "body": {"detail": "Invalid dossier_id format"}}
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.VALIDATOR, UserRole.ADMINISTRATOR])
            
            # Get dossier
            result = await db.execute(select(Dossier).where(Dossier.id == dossier_id))
            dossier = result.scalar_one_or_none()
            
            if not dossier:
                return {"status": 404, "body": {"detail": "Dossier not found"}}
            
            # Get documents for this dossier
            documents_result = await db.execute(
                select(Document).where(Document.dossier_id == dossier_id)
            )
            documents = documents_result.scalars().all()
            document_type_ids = [doc.document_type_id for doc in documents if doc.document_type_id]
            
            # Get validation rules that apply to this dossier
            # Rules can be:
            # 1. Process-specific (process_id matches)
            # 2. Document-type-specific (document_type_id matches)
            # 3. General (no process_id or document_type_id)
            rule_conditions = [
                ValidationRule.is_active == True
            ]
            
            if dossier.process_id:
                rule_conditions.append(
                    or_(
                        ValidationRule.process_id == dossier.process_id,
                        ValidationRule.process_id.is_(None)
                    )
                )
            
            if document_type_ids:
                rule_conditions.append(
                    or_(
                        ValidationRule.document_type_id.in_(document_type_ids),
                        ValidationRule.document_type_id.is_(None)
                    )
                )
            
            rules_result = await db.execute(
                select(ValidationRule).where(*rule_conditions)
            )
            rules = rules_result.scalars().all()
            
            # Get validation results for this dossier
            results_result = await db.execute(
                select(ValidationResult).where(ValidationResult.dossier_id == dossier_id)
            )
            validation_results = results_result.scalars().all()
            
            # Get extracted fields
            fields_result = await db.execute(
                select(ExtractedField).where(ExtractedField.dossier_id == dossier_id)
            )
            extracted_fields = fields_result.scalars().all()
            
            # Get field schemas for document types
            schemas_result = await db.execute(
                select(FieldSchema).where(
                    FieldSchema.document_type_id.in_(document_type_ids),
                    FieldSchema.is_active == True
                ) if document_type_ids else select(FieldSchema).where(FieldSchema.is_active == False)
            )
            field_schemas = schemas_result.scalars().all() if document_type_ids else []
            
            # Build response
            rules_data = []
            for rule in rules:
                # Find validation result for this rule
                rule_result = next(
                    (r for r in validation_results if r.rule_id == rule.id),
                    None
                )
                
                rules_data.append({
                    "id": str(rule.id),
                    "code": rule.code,
                    "name": rule.name,
                    "description": rule.description,
                    "rule_type": rule.rule_type,
                    "severity": rule.severity,
                    "expression": rule.expression,
                    "error_message": rule.error_message,
                    "can_override": rule.can_override,
                    "status": rule_result.status if rule_result else None,
                    "message": rule_result.message if rule_result else None,
                    "overridden": rule_result.overridden if rule_result else False,
                    "executed_at": rule_result.executed_at.isoformat() if rule_result and rule_result.executed_at else None
                })
            
            fields_data = []
            for field in extracted_fields:
                fields_data.append({
                    "id": str(field.id),
                    "field_name": field.field_name,
                    "value": field.value,
                    "confidence": float(field.confidence) if field.confidence else None,
                    "status": field.status.value if hasattr(field.status, "value") else str(field.status),
                    "source_document_id": str(field.document_id) if field.document_id else None,
                    "extracted_at": field.extracted_at.isoformat() if field.extracted_at else None
                })
            
            schemas_data = []
            for schema in field_schemas:
                schemas_data.append({
                    "id": str(schema.id),
                    "field_name": schema.field_name,
                    "display_name": schema.display_name,
                    "description": schema.description,
                    "data_type": schema.data_type,
                    "is_required": schema.is_required,
                    "validation_pattern": schema.validation_pattern,
                    "display_order": schema.display_order
                })
            
            return {
                "status": 200,
                "body": {
                    "dossier_id": str(dossier.id),
                    "dossier_reference": dossier.reference,
                    "dossier_status": dossier.status.value if hasattr(dossier.status, "value") else str(dossier.status),
                    "process_id": str(dossier.process_id) if dossier.process_id else None,
                    "assigned_validator_id": str(dossier.assigned_validator_id) if dossier.assigned_validator_id else None,
                    "rules": rules_data,
                    "validation_results": [
                        {
                            "id": str(r.id),
                            "rule_id": str(r.rule_id),
                            "status": r.status,
                            "message": r.message,
                            "affected_fields": r.affected_fields or [],
                            "overridden": r.overridden,
                            "override_reason": r.override_reason,
                            "executed_at": r.executed_at.isoformat() if r.executed_at else None
                        }
                        for r in validation_results
                    ],
                    "extracted_fields": fields_data,
                    "field_schemas": schemas_data,
                    "documents": [
                        {
                            "id": str(doc.id),
                            "document_type_id": str(doc.document_type_id) if doc.document_type_id else None,
                            "filename": doc.filename,
                            "processing_status": doc.processing_status.value if hasattr(doc.processing_status, "value") else str(doc.processing_status)
                        }
                        for doc in documents
                    ],
                    "summary": {
                        "total_rules": len(rules_data),
                        "passed_rules": len([r for r in validation_results if r.status == "passed"]),
                        "failed_rules": len([r for r in validation_results if r.status == "error"]),
                        "warning_rules": len([r for r in validation_results if r.status == "warning"]),
                        "total_fields": len(fields_data),
                        "confirmed_fields": len([f for f in fields_data if f["status"] == "CONFIRMED"]),
                        "total_documents": len(documents)
                    }
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting validation state: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

