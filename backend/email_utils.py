import resend
import random
import os

resend.api_key = os.getenv("RESEND_API_KEY")

FROM_EMAIL = "onboarding@resend.dev"
ADMIN_EMAIL = "aryan@ecoconnectservices.com"

def send_admin_notification(name: str, email: str, role: str):
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": ADMIN_EMAIL,
            "subject": f"🌱 New {role.capitalize()} Signup — {name}",
            "html": f"<p><b>Name:</b> {name}</p><p><b>Email:</b> {email}</p><p><b>Role:</b> {role}</p>"
        })
    except Exception as e:
        print(f"[Email] Notification failed: {e}")

def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_email(to_email: str, name: str, otp: str):
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to_email,
            "subject": "Verify your Ecoconnect account",
            "html": f"<h2>Welcome {name}!</h2><h1 style='color:#059669;letter-spacing:8px'>{otp}</h1><p>Valid for 10 minutes.</p>"
        })
    except Exception as e:
        print(f"[Email] OTP failed: {e}")

def send_welcome_email(to_email: str, name: str):
    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": to_email,
            "subject": "Welcome to Ecoconnect! 🌱",
            "html": f"<h2>Welcome {name}! 🌱</h2><p>Your account is verified. Start exploring projects!</p>"
        })
    except Exception as e:
        print(f"[Email] Welcome email failed: {e}")