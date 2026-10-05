import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL")

print(f"Testing SMTP connection to {SMTP_HOST}:{SMTP_PORT} with user {SMTP_USER}...")

msg = EmailMessage()
msg.set_content("This is a test email to verify your SMTP configuration for the Bhu-Dristi prototype.")
msg["Subject"] = "SMTP Test Verification - Bhu-Dristi"
msg["From"] = SMTP_FROM_EMAIL
msg["To"] = SMTP_USER  # Send it to yourself

try:
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
    print("\n✅ SUCCESS: Test email sent successfully! Your credentials are correct.")
except Exception as e:
    print(f"\n❌ ERROR: Failed to send email.")
    print(f"Details: {e}")
