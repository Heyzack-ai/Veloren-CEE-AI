"""Get model performance metrics endpoint step."""
from datetime import date
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from app.models.model_performance import ModelPerformanceMetrics
from sqlalchemy import select, func

config = {
    "name": "GetModelPerformance",
    "type": "api",
    "path": "/api/analytics/model-performance",
    "method": "GET",
    "responseSchema": {
        "models": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "model_name": {"type": "string"},
                    "model_version": {"type": "string"},
                    "task_type": {"type": "string"},
                    "metrics": {"type": "object"}
                }
            }
        },
        "total_metrics": {"type": "integer"}
    }
}

async def handler(req, context):
    """Handle get model performance request."""
    headers = req.get("headers", {})
    auth_header = headers.get("authorization") or headers.get("Authorization", "")
    
    if not auth_header.startswith("Bearer "):
        return {
            "status": 401,
            "body": {"detail": "Could not validate credentials"},
            "headers": {"WWW-Authenticate": "Bearer"}
        }
    
    token = auth_header.replace("Bearer ", "")
    query = req.get("query", {})
    model_name = query.get("model_name")
    task_type = query.get("task_type")
    date_from_str = query.get("date_from")
    date_to_str = query.get("date_to")
    
    session_maker = get_session_maker()
    async with session_maker() as db:
        try:
            current_user = await get_current_user_from_token(token, db)
            require_role_from_user(current_user, [UserRole.ADMINISTRATOR])
            
            # Build query
            metrics_query = select(ModelPerformanceMetrics)
            
            if model_name:
                metrics_query = metrics_query.where(ModelPerformanceMetrics.model_name == model_name)
            if task_type:
                metrics_query = metrics_query.where(ModelPerformanceMetrics.task_type == task_type)
            if date_from_str:
                try:
                    date_from = date.fromisoformat(date_from_str)
                    metrics_query = metrics_query.where(ModelPerformanceMetrics.evaluation_date >= date_from)
                except ValueError:
                    pass
            if date_to_str:
                try:
                    date_to = date.fromisoformat(date_to_str)
                    metrics_query = metrics_query.where(ModelPerformanceMetrics.evaluation_date <= date_to)
                except ValueError:
                    pass
            
            result = await db.execute(metrics_query.order_by(ModelPerformanceMetrics.evaluation_date.desc()))
            all_metrics = result.scalars().all()
            
            # Group by model and task type
            by_model = {}
            for metric in all_metrics:
                key = f"{metric.model_name}_{metric.task_type}"
                if key not in by_model:
                    by_model[key] = {
                        "model_name": metric.model_name,
                        "model_version": metric.model_version,
                        "task_type": metric.task_type,
                        "metrics": {}
                    }
                
                metric_name = metric.metric_name
                if metric_name not in by_model[key]["metrics"]:
                    by_model[key]["metrics"][metric_name] = []
                
                by_model[key]["metrics"][metric_name].append({
                    "value": float(metric.metric_value),
                    "sample_size": metric.sample_size,
                    "evaluation_date": metric.evaluation_date.isoformat(),
                    "metadata": metric.meta_data
                })
            
            # Calculate averages
            for key, model_data in by_model.items():
                for metric_name, values in model_data["metrics"].items():
                    if values:
                        avg_value = sum(v["value"] for v in values) / len(values)
                        model_data["metrics"][f"{metric_name}_avg"] = avg_value
                        model_data["metrics"][f"{metric_name}_latest"] = values[0]["value"] if values else None
            
            return {
                "status": 200,
                "body": {
                    "models": list(by_model.values()),
                    "total_metrics": len(all_metrics)
                }
            }
        except ValueError as e:
            return {"status": 401 if "credentials" in str(e) else 403, "body": {"detail": str(e)}}
        except Exception as e:
            context.logger.error(f"Error getting model performance: {e}", exc_info=True)
            return {"status": 500, "body": {"detail": "Internal server error"}}

