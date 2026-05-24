"""
Telegram Bot Tool — CrewAI-compatible.

Official Telegram Bot API — zero ban risk, free, unlimited messages.

Setup (2 minutes):
  1. Open Telegram → search @BotFather → /newbot → get token
  2. Set TELEGRAM_BOT_TOKEN=... in .env
  3. For group messages: create a channel, add bot as admin
  4. For direct messages: each parent must start a chat with @YourBot first

Architecture:
  - send_telegram → to a specific chat_id (user or channel)
  - send_telegram_bulk → to multiple chat_ids
  - send_telegram_channel → to the club channel (set TELEGRAM_CHANNEL_ID)

No ban risk — this is the official API.
"""

import json
import logging
import os
import urllib.parse
from typing import Optional

import httpx
from crewai.tools import tool

logger = logging.getLogger(__name__)

# ── Config ──────────────────────────────────────────────────────────────
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHANNEL_ID = os.getenv("TELEGRAM_CHANNEL_ID", "")  # e.g., @SKBWaterpoloClub

TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}" if TELEGRAM_TOKEN else ""


# ── Send Message ─────────────────────────────────────────────────────────

def _send_telegram_raw(chat_id: str, text: str, parse_mode: str = "HTML") -> dict:
    """Send a Telegram message via the Bot API.

    Args:
        chat_id: Telegram chat ID (@channel or numeric ID).
        text: Message text (supports HTML formatting).
        parse_mode: 'HTML', 'MarkdownV2', or empty string.

    Returns:
        Dict with status and Telegram response.
    """
    if not TELEGRAM_TOKEN:
        return {"status": "error", "error": "TELEGRAM_BOT_TOKEN not configured"}

    url = f"{TELEGRAM_API}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": parse_mode,
        "disable_web_page_preview": True,
    }

    try:
        resp = httpx.post(url, json=payload, timeout=15)
        data = resp.json()
        if resp.status_code == 200 and data.get("ok"):
            msg_id = data["result"]["message_id"]
            logger.info("Telegram → %s: msg_id=%s", chat_id, msg_id)
            return {
                "status": "sent",
                "provider": "telegram",
                "chat_id": chat_id,
                "message_id": msg_id,
            }
        else:
            error = data.get("description", resp.text)
            logger.error("Telegram error: %s", error)
            return {"status": "error", "provider": "telegram", "chat_id": chat_id, "error": error}
    except Exception as exc:
        logger.error("Telegram request failed: %s", exc)
        return {"status": "error", "provider": "telegram", "chat_id": chat_id, "error": str(exc)}


# ── CrewAI Tools ─────────────────────────────────────────────────────────

@tool("send_telegram")
def send_telegram(chat_id: str, message: str) -> str:
    """Send a message via Telegram Bot API.

    Requires TELEGRAM_BOT_TOKEN in environment.
    Chat ID can be a username (@parent_name), numeric ID, or channel (@clubchannel).

    HTML formatting supported: <b>bold</b>, <i>italic</i>, <code>mono</code>,
    <a href="url">link</a>, <pre>code block</pre>.

    Args:
        chat_id: Telegram chat ID or @username.
        message: Message text (HTML formatted).

    Returns:
        JSON string with delivery status.
    """
    result = _send_telegram_raw(chat_id, message)
    return json.dumps(result, indent=2)


@tool("send_telegram_bulk")
def send_telegram_bulk(chat_ids: str, message: str) -> str:
    """Send the same Telegram message to multiple chat IDs.

    Args:
        chat_ids: Comma-separated chat IDs or @usernames.
        message: Message text (HTML formatted).

    Returns:
        JSON string with delivery status per recipient.
    """
    ids = [c.strip() for c in chat_ids.split(",") if c.strip()]
    results = []
    for chat_id in ids:
        result = _send_telegram_raw(chat_id, message)
        results.append(result)

    summary = {
        "total": len(ids),
        "sent": sum(1 for r in results if r.get("status") == "sent"),
        "errors": sum(1 for r in results if r.get("status") == "error"),
        "results": results,
    }
    return json.dumps(summary, indent=2)


@tool("send_telegram_channel")
def send_telegram_channel(message: str) -> str:
    """Send a message to the configured club Telegram channel.

    Uses TELEGRAM_CHANNEL_ID from environment (e.g., @SKBWaterpoloParents).
    Parents join the channel once and receive all club communications.

    Args:
        message: Message text (HTML formatted).

    Returns:
        JSON string with delivery status.
    """
    if not TELEGRAM_CHANNEL_ID:
        return json.dumps({
            "status": "error",
            "error": "TELEGRAM_CHANNEL_ID not configured. Set it in .env to your channel @username.",
        }, indent=2)

    result = _send_telegram_raw(TELEGRAM_CHANNEL_ID, message)
    return json.dumps(result, indent=2)
