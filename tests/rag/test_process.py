import sys 
sys.path.append("packages/rag/process")
import process

def test_process():
    res = process.process({})
    assert res["output"] == "process"
