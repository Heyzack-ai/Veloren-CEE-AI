"""Create validator endpoint step."""
from uuid import UUID
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.validator import Validator
from sqlalchemy import select

config = {
    "name": "CreateValidator",
    "type": "api",
    "path": "/api/validators",
    "method": "POST",
    "bodySchema": {
        "email": {"type": "string", "format": "email", "required": True},
        "password": {"type": "string", "minLength": 8, "required": True},
        "name": {"type": "string", "required": True},
        "employee_id": {"type": "string"},
        "department": {"type": "string"},
        "specialization": {"type": "string"},
        "certifications": {"type": "array"},
        "max_concurrent_dossiers": {"type": "string"},
        "notes": {"type": "string"}
    }
}

async def handler(req, context):
    """Handle create validator request."""
    headers = req.get("headers", {})
    auth_header = headers.get("authorization") or headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return {
            "status": 401,
            "body": {"detail": "Could not validate credentials"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    token = auth_header.replace("Bearer ", "")
    body = req.get("body", {})
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            current_user = await require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            # Extract user credentials
            email = body.get("email")
            password = body.get("password")
            name = body.get("name")
            
            if not email or not password or not name:
                return {
                    "status": 400,
                    "body": {"detail": "email, password, and name are required"}
                }
            
            # Check if user with this email already exists
            existing_user = await db.execute(select(User).where(User.email == email))
            if existing_user.scalar_one_or_none():
                return {
                    "status": 400,
                    "body": {"detail": "Email already exists"}
                }
            
            # Create user account
            user = User(
                email=email,
                password_hash=get_password_hash(password),
                name=name,
                role=UserRole.VALIDATOR
            )
            db.add(user)
            await db.flush()  # Flush to get user.id without committing
            
            # Create validator record
            validator = Validator(
                user_id=user.id,
                employee_id=body.get("employee_id"),
                department=body.get("department"),
                specialization=body.get("specialization"),
                certifications=body.get("certifications", []),
                max_concurrent_dossiers=body.get("max_concurrent_dossiers", "10"),
                validation_stats=body.get("validation_stats", {}),
                notes=body.get("notes"),
                active=True
            )
            db.add(validator)
            await db.commit()
            await db.refresh(user)
            await db.refresh(validator)
            
            # Log activity
            try:
                from app.services.activity import ActivityLogger
                logger = ActivityLogger(db)
                await logger.log(
                    user_id=str(current_user.id),
                    action_type="validator.created",
                    entity_type="validator",
                    entity_id=str(validator.id),
                    description=f"Validator {name} created with user {email}"
                )
            except Exception:
                pass
            
            return {
                "status": 201,
                "body": {
                    "user_id": str(user.id),
                    "user_email": user.email,
                    "user_name": user.name,
                    "validator_id": str(validator.id),
                    "employee_id": validator.employee_id,
                    "department": validator.department,
                    "specialization": validator.specialization,
                    "active": validator.active,
                    "created_at": validator.created_at.isoformat() if validator.created_at else None
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error creating validator: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

