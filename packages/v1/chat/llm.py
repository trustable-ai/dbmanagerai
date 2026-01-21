from openai import OpenAI
import os, socket, time, json, pathlib

# load the instruction file
# the file format is:
def loader(file):
    abs_path = os.path.abspath(__file__)
    current_dir = os.path.dirname(abs_path)
    path =  pathlib.Path(os.path.join(current_dir, file))
    text = path.read_text()
    lines = text.split("\n")
    res = []
    for line in lines:
        try:
            line = line.strip()
            if not line.startswith("{"):
                continue
            res.append(json.loads(line))
        except:
            print("error parsing line:", line)
    print(f"loaded #{len(res)} instructions from {file}")
    return res

class LLM:
    def __init__(self, args):
        # params
        self.base_url  = args.get("OPENAI_BASE_URL", os.getenv("OPENAI_BASE_URL", "missing OPENAI_BASE_URL"))
        self.api_key = args.get("OPENAI_API_KEY", os.getenv("OPENAI_API_KEY", "missing OPENAI_API_KEY"))
        self.model = args.get("OPENAI_MODEL", os.getenv("OPENAI_MODEL", "missing OPENAI_MODEL"))
        self.rate = 0.01
        # urls
        self.ai = OpenAI(base_url=self.base_url, api_key=self.api_key)

        self.instruct = loader("doc.jsonl")
        print(self.model)
        print(self.instruct)

        self.messages = self.instruct
        self.context = []
        if "messages" in args:
            self.context = args.get("messages", [])
            self.messages += self.context

    def welcome(self, args):
        return self.text(args, f"Welcome to TruGPT\nHost:{self.base_url}\nModel:{self.model}")

    def message(self, role, content):
        self.messages.append({"role": role, "content":content})

    def stream(self, args, lines):
        out = ""
        sock = None
        host = args.get("STREAM_HOST", "")
        port = int(args.get("STREAM_PORT") or "0")
        if host and port:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect((host,port))
        try:
            for line in lines:
                if sock is not None:
                    #print(line + ":" + line.encode().hex())
                    sock.sendall(json.dumps(line).encode("utf-8"))
                    time.sleep(self.rate)
                out += line
        except Exception as e:
            print(e)
            print("interrupted")
        if sock is not None:
            sock.close()
        return out

    def _ask(self, inp):
        self.messages.append({"role": "user", "content": inp})
        for msg in self.messages:
            print(f"{msg['role']}: {msg['content']}")
        stream = self.ai.chat.completions.create(
            model=self.model,
            messages=self.messages,
            stream=True
        )
        for chunk in stream:
            # ogni chunk è un oggetto tipo Event
            if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                yield content

    def ask(self, args, inp):
        st = self._ask(inp)
        return self.stream(args, st)

    def _text(self, lines):
        for line in lines.splitlines():
            for word in line.split(" "):
                yield word+" "
            yield "\n"

    def text(self, args, lines):
        return self.stream(args, self._text(lines))
