#--kind python:default
#--web true

#-p POSTGRES_URL "$POSTGRES_URL"
#-p REDIS_URL "$REDIS_URL"
#-p REDIS_PREFIX "$REDIS_PREFIX"

import sql
def main(args):

  # invoked by the CLI
  return {"body": sql.sql(args) }
