import os, requests as req, socket, json, time
MODEL="phi4:14b"

def stream(args, lines, state=None):
  out = ""
  sock = None
  addr = (args.get("STREAM_HOST", ""),int(args.get("STREAM_PORT") or "0"))
  if addr[0] and addr:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect(addr)
    #print(addr, sock)
    if state:
      buf = json.dumps(state).encode("utf-8")
      #print(buf)
      sock.sendall(buf)
      time.sleep(0.01)  # give some time to process the state

  for line in lines:
    msg = {}
    try:
      jo = json.loads(line.decode("utf-8"))
      if "response" in jo:
        res =jo.get("response", "")
        msg["output"] = res
        out += res
    except:
      msg["output"] = line
      out += line

    if sock is not None:
        buf = json.dumps(msg).encode("utf-8")
        #print(buf)
        sock.sendall(buf)
  if sock is not None:
    sock.close()
  return out

def url(args):
    proto = args.get("OLLAMA_PROTO", os.getenv("OLLAMA_PROTO","https"))
    host = args.get("OLLAMA_HOST", os.getenv("OLLAMA_HOST"))
    auth = args.get("OLLAMA_TOKEN", os.getenv("AUTH"))
    return f"{proto}://{auth}@{host}/api/generate"

def sllm(args):
  out = f"Welcome to {MODEL}"
  inp = args.get("input")
  if inp:
    msg = { "model": MODEL, "prompt": inp, "stream": True }
    lines = req.post(url(args), json=msg, stream=True).iter_lines()
    out = stream(args, lines)

  return { "output": out, "streaming": True }
