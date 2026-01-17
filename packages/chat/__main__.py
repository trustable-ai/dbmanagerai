#--kind python:default
#--web true
#--timeout 600000
#--param VERSION "$VITE_VERSION"
#--param OPENAI_API_KEY "$OPENAI_API_KEY"
#--param OPENAI_BASE_URL "$OPENAI_BASE_URL"
#--param OPENAI_CHAT "$OPENAI_CHAT"

import chat
def main(args):
  return { "body": chat.chat(args) }
