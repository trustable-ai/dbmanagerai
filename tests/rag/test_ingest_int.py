import os, requests as req
def test_ingest():
    url = os.environ.get("OPSDEV_HOST") + "/api/my/rag/ingest"
    res = req.get(url).json()
    assert res.get("output") == "ingest"
