"""Create installer endpoint step."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.installer import Installer
from app.schemas.installer import InstallerCreate
from sqlalchemy import select

config = {
    "name": "CreateInstaller",
    "type": "api",
    "path": "/api/installers",
    "method": "POST",
    "bodySchema": {
        "email": {"type": "string", "format": "email", "required": True},
        "password": {"type": "string", "minLength": 8, "required": True},
        "name": {"type": "string", "required": True},
        "company_name": {"type": "string", "required": True},
        "siret": {"type": "string", "required": True},
        "siren": {"type": "string", "required": True},
        "address": {"type": "string", "required": True},
        "city": {"type": "string", "required": True},
        "postal_code": {"type": "string", "required": True},
        "contact_name": {"type": "string", "required": True},
        "contact_email": {"type": "string", "format": "email", "required": True},
        "contact_phone": {"type": "string"},
        "rge_number": {"type": "string"},
        "qualifications": {"type": "array"}
    },
    "responseSchema": {
        "user_id": {"type": "string", "format": "uuid"},
        "user_email": {"type": "string", "format": "email"},
        "user_name": {"type": "string"},
        "installer_id": {"type": "string", "format": "uuid"},
        "siret": {"type": "string"},
        "company_name": {"type": "string"},
        "city": {"type": "string"},
        "active": {"type": "boolean"},
        "created_at": {"type": "string", "format": "date-time"}
    }
}

async def handler(req, context):
    """Handle create installer request."""
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
            
            # Check if installer with this SIRET already exists
            siret = body.get("siret")
            if siret:
                existing_installer = await db.execute(select(Installer).where(Installer.siret == siret))
                if existing_installer.scalar_one_or_none():
                    return {
                        "status": 400,
                        "body": {"detail": "SIRET already exists"}
                    }
            
            # Create user account
            user = User(
                email=email,
                password_hash=get_password_hash(password),
                name=name,
                role=UserRole.INSTALLER
            )
            db.add(user)
            await db.flush()  # Flush to get user.id without committing
            
            # Create installer record
            installer_data = {
                "user_id": user.id,
                "company_name": body.get("company_name"),
                "siret": body.get("siret"),
                "siren": body.get("siren"),
                "address": body.get("address"),
                "city": body.get("city"),
                "postal_code": body.get("postal_code"),
                "contact_name": body.get("contact_name", name),
                "contact_email": body.get("contact_email", email),
                "contact_phone": body.get("contact_phone"),
                "rge_number": body.get("rge_number"),
                "qualifications": body.get("qualifications", []),
                "active": True
            }
            
            installer = Installer(**installer_data)
            db.add(installer)
            await db.commit()
            await db.refresh(user)
            await db.refresh(installer)
            
            # Log activity
            try:
                from app.services.activity import ActivityLogger
                logger = ActivityLogger(db)
                await logger.log(
                    user_id=str(current_user.id),
                    action_type="installer.created",
                    entity_type="installer",
                    entity_id=str(installer.id),
                    description=f"Installer {installer.company_name} created with user {email}"
                )
            except Exception:
                pass
            
            return {
                "status": 201,
                "body": {
                    "user_id": str(user.id),
                    "user_email": user.email,
                    "user_name": user.name,
                    "installer_id": str(installer.id),
                    "siret": installer.siret,
                    "company_name": installer.company_name,
                    "city": installer.city,
                    "active": installer.active,
                    "created_at": installer.created_at.isoformat() if installer.created_at else None
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error creating installer: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

