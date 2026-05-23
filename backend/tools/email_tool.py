"""
Email Tool — CrewAI-compatible.

PoC: Logs emails to stdout + returns preview.
Production: Swap with Resend / SendGrid / AWS SES SMTP.
"""

import json
import logging

from crewai.tools import tool

logger = logging.getLogger(__name__)


@tool("send_parent_email")
def send_parent_email(recipients: str, subject: str, body: str) -> str:
    """Send a programmatic email to player parents.

    In PoC mode, this logs the email rather than actually sending it.
    Set AQUAOS_EMAIL_REAL=true + SMTP_* env vars for production delivery.

    Args:
        recipients: Comma-separated parent email addresses.
        subject: Email subject line.
        body: Full email body (plain text or HTML).

    Returns:
        JSON with delivery status and preview.
    """
    recipient_list = [r.strip() for r in recipients.split(",") if r.strip()]

    if not recipient_list:
        return json.dumps({"status": "error", "detail": "No valid recipients"})

    # PoC: log only
    email_log = {
        "status": "logged",
        "mode": "poc",
        "to": recipient_list,
        "subject": subject,
        "body_preview": body[:200] + ("..." if len(body) > 200 else ""),
    }

    logger.info(
        "send_parent_email → %d recipients | subject: %s",
        len(recipient_list),
        subject,
    )

    # Print the full email body so it's visible in system logs
    print(f"\n{'='*60}\n📧 PARENT EMAIL (PoC — not sent)\n{'='*60}")
    print(f"TO: {', '.join(recipient_list)}")
    print(f"SUBJECT: {subject}")
    print(f"\n{body}")
    print(f"{'='*60}\n")

    return json.dumps(email_log, indent=2)
