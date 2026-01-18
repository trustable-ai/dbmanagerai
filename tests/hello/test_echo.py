import sys 
sys.path.append("packages/hello/echo")
import echo

def test_echo():
    res = echo.echo({})
    assert res["output"] == "echo"
