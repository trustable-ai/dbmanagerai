import sys 
sys.path.append("packages/rag/ingest")
import ingest

def test_ingest():
    res = ingest.ingest({})
    assert res["output"] == "ingest"
