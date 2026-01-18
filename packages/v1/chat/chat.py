import os, requests as req, socket, json, time

def stream_to_socket(args, lines):
    out = ""
    sock = None
    addr = (args.get("STREAM_HOST", ""), int(args.get("STREAM_PORT") or "0"))
    if addr[0] and addr[1]:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect(addr)

    for line in lines:
        if not line:
            continue
        try:
            text = line.decode("utf-8") if isinstance(line, bytes) else line
            if text.startswith("data: "):
                text = text[6:]
            if text == "[DONE]":
                break
            jo = json.loads(text)
            choices = jo.get("choices", [])
            if choices:
                delta = choices[0].get("delta", {})
                content = delta.get("content", "")
                if content:
                    msg = {"output": content}
                    out += content
                    if sock is not None:
                        buf = json.dumps(msg).encode("utf-8")
                        sock.sendall(buf)
        except:
            pass

    if sock is not None:
        sock.close()
    return out

def chat(args):
    base_url = args.get("OPENAI_BASE_URL", os.getenv("OPENAI_BASE_URL", ""))
    api_key = args.get("OPENAI_API_KEY", os.getenv("OPENAI_API_KEY", ""))
    model = args.get("OPENAI_MODEL", os.getenv("OPENAI_MODEL", "gpt-4"))

    messages = args.get("input", [])
    if not messages:
        return {"output": "No input provided", "streaming": False}

    url = f"{base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": messages,
        "stream": True
    }

    response = req.post(url, headers=headers, json=payload, stream=True)
    lines = response.iter_lines()
    out = stream_to_socket(args, lines)

    return {"output": out, "streaming": True}
