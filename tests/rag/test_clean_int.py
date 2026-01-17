import os, requests as req
def test_clean():
    url = os.environ.get("OPSDEV_HOST") + "/api/my/rag/clean"
    res = req.get(url).json()
    assert res.get("output") == "clean"
