#--kind python:default
#--web true
#--param OLLAMA_PROTO $OLLAMA_PROTO
#--param OLLAMA_HOST $OLLAMA_HOST
#--param OLLAMA_TOKEN $AUTH
import sllm

def main(args):
  return { "body": sllm.sllm(args) }
