import os, requests as req
MODEL="llama3.2:3b"

url = None

def llm(args):
  global url
  if  url is None:
    proto = args.get("OLLAMA_PROTO", os.getenv("OLLAMA_PROTO","https"))
    host = args.get("OLLAMA_HOST", os.getenv("OLLAMA_HOST"))
    auth = args.get("OLLAMA_TOKEN", os.getenv("AUTH"))
    url =  f"{proto}://{auth}@{host}/api/generate"
  out = f"Welcome to {MODEL}"
  inp = args.get("input")
  if inp:
    msg = { "model": MODEL, "prompt": inp, "stream": False }
    res = req.post(url, json=msg).json()
    out = res.get("response", "error")
  
  return { "output": out }
