"""
In-house logging and monitoring system for Pluto Health
Tracks errors, performance, and usage patterns without external services
"""
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from enum import Enum

class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class PlutoLogger:
    """
    Simple file-based logger with structured JSON output
    Provides error tracking and performance monitoring without external services
    """
    
    def __init__(self, log_dir: str = "logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(exist_ok=True)
        
        # Separate log files for different types
        self.error_log = self.log_dir / "errors.jsonl"
        self.triage_log = self.log_dir / "triage.jsonl"
        self.performance_log = self.log_dir / "performance.jsonl"
        self.access_log = self.log_dir / "access.jsonl"
        
        # In-memory metrics for dashboard
        self.metrics = {
            "total_requests": 0,
            "successful_triages": 0,
            "failed_triages": 0,
            "total_errors": 0,
            "avg_response_time": 0,
            "last_error": None,
            "start_time": time.time()
        }
    
    def _write_log(self, filepath: Path, data: Dict[str, Any]) -> None:
        """Write structured log entry"""
        with open(filepath, 'a') as f:
            f.write(json.dumps(data) + '\n')
    
    def log_triage(self, user_id: Optional[str], input_text: str, 
                   result: Dict[str, Any], duration_ms: float) -> None:
        """Log a triage request"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": "triage",
            "user_id": user_id or "anonymous",
            "input_length": len(input_text),
            "triage_level": result.get("triage_level"),
            "ai_called": result.get("llm_called", False),
            "duration_ms": duration_ms,
            "version": result.get("version")
        }
        
        self._write_log(self.triage_log, log_entry)
        
        # Update metrics
        self.metrics["total_requests"] += 1
        self.metrics["successful_triages"] += 1
        
        # Update rolling average response time
        total = self.metrics["total_requests"]
        self.metrics["avg_response_time"] = (
            (self.metrics["avg_response_time"] * (total - 1) + duration_ms) / total
        )
    
    def log_error(self, error_type: str, message: str, context: Dict[str, Any] = None,
                  level: LogLevel = LogLevel.ERROR) -> None:
        """Log an error with context"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level.value,
            "error_type": error_type,
            "message": message,
            "context": context or {}
        }
        
        self._write_log(self.error_log, log_entry)
        
        # Update metrics
        self.metrics["total_errors"] += 1
        self.metrics["last_error"] = {
            "type": error_type,
            "message": message,
            "time": datetime.utcnow().isoformat()
        }
        
        if level in [LogLevel.ERROR, LogLevel.CRITICAL]:
            self.metrics["failed_triages"] += 1
    
    def log_performance(self, endpoint: str, duration_ms: float, 
                       status_code: int, user_id: Optional[str] = None) -> None:
        """Log API performance"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "endpoint": endpoint,
            "duration_ms": duration_ms,
            "status_code": status_code,
            "user_id": user_id or "anonymous"
        }
        
        self._write_log(self.performance_log, log_entry)
    
    def log_access(self, endpoint: str, method: str, user_id: Optional[str],
                   ip_address: str, user_agent: Optional[str] = None) -> None:
        """Log API access"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "endpoint": endpoint,
            "method": method,
            "user_id": user_id or "anonymous",
            "ip_address": ip_address,
            "user_agent": user_agent
        }
        
        self._write_log(self.access_log, log_entry)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics for dashboard"""
        uptime = time.time() - self.metrics["start_time"]
        return {
            **self.metrics,
            "uptime_seconds": uptime,
            "uptime_hours": uptime / 3600,
            "success_rate": (
                self.metrics["successful_triages"] / self.metrics["total_requests"]
                if self.metrics["total_requests"] > 0 else 0
            ),
            "error_rate": (
                self.metrics["failed_triages"] / self.metrics["total_requests"]
                if self.metrics["total_requests"] > 0 else 0
            )
        }
    
    def get_recent_errors(self, limit: int = 10) -> list:
        """Get recent errors for debugging"""
        if not self.error_log.exists():
            return []
        
        errors = []
        with open(self.error_log, 'r') as f:
            # Read last N lines
            lines = f.readlines()
            for line in lines[-limit:]:
                try:
                    errors.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        
        return errors[::-1]  # Reverse to show most recent first
    
    def get_triage_stats(self, hours: int = 24) -> Dict[str, Any]:
        """Get triage statistics for the last N hours"""
        if not self.triage_log.exists():
            return {"total": 0, "levels": {}}
        
        cutoff_time = datetime.utcnow().timestamp() - (hours * 3600)
        levels = {}
        total = 0
        
        with open(self.triage_log, 'r') as f:
            for line in f:
                try:
                    entry = json.loads(line)
                    entry_time = datetime.fromisoformat(entry["timestamp"]).timestamp()
                    
                    if entry_time >= cutoff_time:
                        total += 1
                        level = entry.get("triage_level", "unknown")
                        levels[level] = levels.get(level, 0) + 1
                except (json.JSONDecodeError, KeyError):
                    continue
        
        return {
            "total": total,
            "levels": levels,
            "period_hours": hours
        }


# Global instance
_logger = PlutoLogger()

def get_logger() -> PlutoLogger:
    """Get global logger instance"""
    return _logger
