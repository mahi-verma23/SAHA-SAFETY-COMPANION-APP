from twilio.rest import Client
import os

def send_sos(lat,lng,contact_number):
    try:
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        autht = os.getenv("TWILIO_AUTH_TOKEN")
        number = os.getenv("TWILIO_PHONE_NUMBER")

        client = Client(account_sid,autht)

        maps_link = f"https://maps.google.com/?q={lat},{lng}"

        msg = (
            f"SOS ALERT ! EMERGENCY !\n"
            f"YOUR CONTACT NEEDS HELP IMMEDIATELY\n"
            f"Location : {maps_link}\n\n"
            f"Emergency : 112 | Police : 100 | Women Helpline : 1091"
        )

        msgsend = client.messages.create(
            body=msg,
            from_ = number,
            to=contact_number
        )

        return {
            "success":True,
            "message_sid" : msgsend.sid,
            "sent": contact_number
            }

    except Exception as e:
        return{
            "success":False,
            "error": str(e)
        }



