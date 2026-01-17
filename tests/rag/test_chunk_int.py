import os, requests as req
def test_chunk():
    url = os.environ.get("OPSDEV_HOST") + "/api/my/rag/chunk"
    res = req.get(url).json()
    assert res.get("output") == "chunk"
