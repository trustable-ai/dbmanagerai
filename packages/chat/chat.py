import llm
import re
import traceback

def dump(args):
   print("OpenWhisk context variables:")
   for key in args.keys():
      if key.startswith("__"):
          print(f"  {key}: {args[key]}")


"""
Read the inp and looks for strings looking like and Email, a Phone Number or a Linkedin URL
If found return a string appending Email:<email> Phone:<phone> Linkeind:<linkedin> otherwise return None
"""
def extract(inp):
  # Regex patterns
  email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
  phone_pattern = r'\b(?:\+?(\d{1,3}))?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\b'
  linkedin_pattern = r'in/[A-Za-z0-9_-]+'

  email = re.search(email_pattern, inp)
  phone = re.search(phone_pattern, inp)
  linkedin = re.search(linkedin_pattern, inp)

  parts = []
  if email:
    parts.append(f"Email:{email.group()}")
  if phone:
    parts.append(f"Phone:{phone.group()}")
  if linkedin:
    parts.append(f"LinkedIn:{linkedin.group()}")

  return " ".join(parts) if parts else None

def table(lang, msg):
    if msg == "thanks":
      return "Grazie di averci fornito le tue informazioni di contatto, provvederemo a contattarti il più presto possibile." \
        if lang == "it" else "Thank you for providing your contact info, we will contact you as soon as possible."
    elif msg == "toomuch":
      return "Grazie di intrattenerti con me, ma siccome vedo che hai molte domande ti raccomandiamo di prenotare una call in fondo alla pagina e parlare con uno dei nostri rappresentanti. Puoi anche fornirmi il tuo email, telefono o profilo linkedin (in/<username>) e ti ricontatteremo." \
        if lang == "it" else "Thank you for spending time with me, but since I see you have many questions, we recommend booking a call at the bottom of the page to speak with one of our representatives. You can also provide your email, phone, or LinkedIn profile (in/<username>) and we will contact you back."
    else:
      return "Non lo so." \
        if lang == "it" else "I do not know."

def chat(args):
  inp = args.get("input", "")

  try:
    ai = llm.LLM(args)
    lang = args.get("lang", "en")

    if inp == "":
      out = ai.welcome(args)
    else:
      info = extract(inp)
      if info:
        out = table(lang, "thanks")
        ai.text(args, out)
      else:
        print(nt.send(f"{hash}[{inp}] origin", origin))
        print("context", len(ai.context))
        if len(ai.context) > 10:
          out = table(lang, "toomuch")
          ai.text(args, out)
        else:
          out = ai.ask(args, inp)
        print(nt.send(f"{hash}[{inp}] chat", out))

  except Exception as e:
    traceback.print_exc()
    out = f"Error: {str(e)}\n"


  return { "output": out, "streaming": True}

