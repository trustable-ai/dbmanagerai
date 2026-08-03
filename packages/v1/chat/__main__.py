#--kind python:default
#--web true
#--timeout 600000
#--param AI_API_KEY "$AI_API_KEY"
#--param AI_BASE_URL "AI_BASE_URL"
#--param AI_MODEL "$AI_MODEL"

import chat
def main(args):
  return { "body": chat.chat(args) }
