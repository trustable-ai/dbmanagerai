#--kind python:default
#--web true
#--param OPSDEV_HOST $OPSDEV_HOST
#--param OPSDEV_USERNAME $OPSDEV_USERNAME
import os, echo
def main(args):
  return { "body": echo.echo(args) }
