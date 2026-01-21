#--kind python:default
#--web true
#--timeout 600000
#--param OPENAI_API_KEY "$OPENAI_API_KEY"
#--param OPENAI_BASE_URL "$OPENAI_BASE_URL"
#--param OPENAI_MODEL "$OPENAI_MODEL"

import chat
def main(args):
  return { "body": chat.chat(args) }
