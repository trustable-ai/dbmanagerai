import os, requests as req
def test_process():
    url = os.environ.get("OPSDEV_HOST") + "/api/my/rag/process"
    res = req.get(url).json()
    assert res.get("output") == "process"
