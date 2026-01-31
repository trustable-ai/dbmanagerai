#--kind python:default
#--web true
#--timeout 600000
#--param POSTGRES_URL "$POSTGRES_URL"

import data
def main(args):
  body, ctype, status = data.handle(args)
  return {
      "body": body,
      "headers": {"Content-Type": ctype},
      "statusCode": status
  }

