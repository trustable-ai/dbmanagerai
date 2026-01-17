import os, requests as req
def test_store():
    url = os.environ.get("OPSDEV_HOST") + "/api/my/rag/store"
    res = req.get(url).json()
    assert res.get("output") == "store"
