#--kind python:default
#--web true
import store
def main(args):
  return { "body": store.store(args) }
