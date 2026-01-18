import os, requests as req
def test_echo():
    url = os.environ.get("OPSDEV_HOST") + "/api/my/hello/echo"
    res = req.get(url).json()
    assert res.get("output") == "echo"
