"""
WhatsApp Tool — CrewAI-compatible.

Two backends:
  1. CallMeBot (free, instant) — set WHATSAPP_API_KEY in env
  2. Twilio (production) — set TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN

Tier auto-detection:
  - If WHATSAPP_API_KEY is set → uses CallMeBot (free, simple HTTP API)
  - If TWILIO_ACCOUNT_SID is set → uses Twilio (official WhatsApp Business API)
  - If neither → logs to stdout (PoC mode)

CallMeBot setup (30 seconds):
  1. Go to https://callmebot.com
  2. Sign in with your WhatsApp number
  3. Get your API key
  4. Set WHATSAPP_API_KEY=YOURKEY in .env

Twilio setup:
  1. Sign up at https://twilio.com
  2. Set up WhatsApp Sandbox
  3. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM

Usage in crew agents:
    from tools.whatsapp_tool import send_whatsapp

    agent = Agent(
        tools=[send_whatsapp],
        ...
    )
"""

import json
import logging
import os
import urllib.parse

import httpx
from crewai.tools import tool

logger = logging.getLogger(__name__)

# ── Provider Detection ──────────────────────────────────────────────────
_callmebot_key = os.getenv("WHATSAPP_API_KEY", "")
_twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
_twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "")
_twilio_from = os.getenv("TWILIO_WHATSAPP_FROM", "")

_whatsapp_mode = "none"
if _callmebot_key:
    _whatsapp_mode = "callmebot"
elif _twilio_sid and _twilio_token and _twilio_from:
    _whatsapp_mode = "twilio"


# ── CallMeBot Backend ───────────────────────────────────────────────────

def _send_via_callmebot(phone: str, message: str) -> dict:
    """Send a WhatsApp message via CallMeBot free API.

    API: GET https://api.callmebot.com/whatsapp.php
    Params: phone, text, apikey
    """
    encoded = urllib.parse.quote(message)
    url = (
        f"https://api.callmebot.com/whatsapp.php"
        f"?phone={phone}&text={encoded}&apikey={_callmebot_key}"
    )

    try:
        resp = httpx.get(url, timeout=15)
        resp.raise_for_status()
        # CallMeBot returns plain text like "Message sent successfully"
        result = resp.text.strip()
        logger.info("CallMeBot → %s: %s", phone, result[:80])
        return {
            "status": "sent",
            "provider": "callmebot",
            "phone": phone,
            "response": result,
        }
    except Exception as exc:
        logger.error("CallMeBot failed: %s", exc)
        return {
            "status": "error",
            "provider": "callmebot",
            "phone": phone,
            "error": str(exc),
        }


# ── Twilio Backend ──────────────────────────────────────────────────────

def _send_via_twilio(phone: str, message: str) -> dict:
    """Send a WhatsApp message via Twilio API."""
    try:
        from twilio.rest import Client

        client = Client(_twilio_sid, _twilio_token)
        msg = client.messages.create(
            from_=f"whatsapp:{_twilio_from}",
            body=message,
            to=f"whatsapp:{phone}",
        )
        logger.info("Twilio → %s: sid=%s", phone, msg.sid)
        return {
            "status": "sent",
            "provider": "twilio",
            "phone": phone,
            "sid": msg.sid,
        }
    except ImportError:
        return {
            "status": "error",
            "provider": "twilio",
            "phone": phone,
            "error": "twilio package not installed. Run: pip install twilio",
        }
    except Exception as exc:
        logger.error("Twilio failed: %s", exc)
        return {
            "status": "error",
            "provider": "twilio",
            "phone": phone,
            "error": str(exc),
        }


# ── PoC (log-only) Backend ──────────────────────────────────────────────

def _send_log_only(phone: str, message: str) -> dict:
    """PoC mode: log the WhatsApp message without sending."""
    print(f"\n{'='*60}\n📱 WHATSAPP (PoC — not sent)\n{'='*60}")
    print(f"TO: {phone}")
    print(f"\n{message}")
    print(f"{'='*60}\n")

    return {
        "status": "logged",
        "provider": "poc",
        "phone": phone,
        "message_preview": message[:200] + ("..." if len(message) > 200 else ""),
    }


# ── Main Tool ───────────────────────────────────────────────────────────

@tool("send_whatsapp")
def send_whatsapp(phone: str, message: str) -> str:
    """Send a WhatsApp message to a phone number.

    Backend auto-detected from environment:
      - CallMeBot (free): set WHATSAPP_API_KEY
      - Twilio (production): set TWILIO_ACCOUNT_SID
      - PoC (log only): no keys configured

    Args:
        phone: Full phone number with country code (e.g., +41791234567).
        message: The message text to send.

    Returns:
        JSON string with delivery status.
    """
    phone = phone.strip().replace(" ", "").replace("-", "")
    if not phone.startswith("+"):
        phone = "+" + phone

    if _whatsapp_mode == "callmebot":
        result = _send_via_callmebot(phone, message)
    elif _whatsapp_mode == "twilio":
        result = _send_via_twilio(phone, message)
    else:
        result = _send_log_only(phone, message)

    return json.dumps(result, indent=2)


# ── Bulk Send ───────────────────────────────────────────────────────────

@tool("send_whatsapp_bulk")
def send_whatsapp_bulk(phones: str, message: str) -> str:
    """Send the same WhatsApp message to multiple phone numbers.

    Args:
        phones: Comma-separated phone numbers with country codes.
        message: The message text to send to all numbers.

    Returns:
        JSON string with delivery status per recipient.
    """
    phone_list = [p.strip() for p in phones.split(",") if p.strip()]
    results = []

    for phone in phone_list:
        # Call the individual sender (handles provider routing internally)
        result_json = send_whatsapp(phone=phone, message=message)
        results.append(json.loads(result_json))

    summary = {
        "total": len(phone_list),
        "sent": sum(1 for r in results if r.get("status") == "sent"),
        "logged": sum(1 for r in results if r.get("status") == "logged"),
        "errors": sum(1 for r in results if r.get("status") == "error"),
        "results": results,
    }

    return json.dumps(summary, indent=2)
