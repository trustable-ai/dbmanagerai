import sys 
sys.path.append("packages/rag/store")
import store

def test_store():
    res = store.store({})
    assert res["output"] == "store"
