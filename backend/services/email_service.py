import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import SMTP_HOST, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD

def send_email_smtp(to_email: str, subject: str, html_body: str, from_name: str = "MinuteMind"):
    """
    Sends an HTML email using SMTP configuration.
    Raises an exception if it fails to send.
    """
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise ValueError("SMTP credentials are not configured. Please check your config/env variables.")
        
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{SMTP_EMAIL}>"
    msg["To"] = to_email

    part = MIMEText(html_body, "html")
    msg.attach(part)

    try:
        # Establish connection with the SMTP server
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.ehlo()
        server.starttls()
        server.ehlo()
        
        # Login and send
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        
        # Cleanup
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email via SMTP: {str(e)}")
        raise e
