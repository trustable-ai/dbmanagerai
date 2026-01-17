import sys
sys.path.append("packages/hello/sllm")
import sllm
import os, requests as req, json

def test_request():
    args = {}
    url = sllm.url(args)
    assert url != ""
    args = {
        "model": "phi4:14b",
        "prompt": "Capital of Italy",
        "stream": True
    }
    res, ans = req.post(url, json=args, stream=True).iter_lines(), ""
    for line in res:
        r = json.loads(line).get("response")
        print(r)
        ans += r
    assert ans.indexOf("Rom") != -1

def test_sllm():
    args = {}
    sllm.sllm(args)
    args = { "input": "hello"}
    sllm.sllm(args)

def streamer(act):
    from urllib3.util import parse_url
    u = os.getenv("OPSDEV_HOST")
    if u:
        p = parse_url(u)
        ns = p.netloc.split(".")[0]
        do = p.netloc.split(".", 1)[1]
        p = p._replace(host="stream."+do, path=f"/web/{ns}/{act}" )
        return p.url
    return None


def stream(args):

    u = streamer("hello/sllm")
    msg = { "input": "capital of italy"  }
    lines = req.post(u, json=msg, stream=True).iter_lines()


    from urllib3 import parse, unparse
