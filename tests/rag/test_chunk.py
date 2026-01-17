import sys
sys.path.insert(0, "packages/rag/chunk")
from chunk import chunk as chunk_func

def test_chunk_empty():
    res = chunk_func({})
    assert res["output"] == []

def test_chunk_small_text():
    """Test chunking with text smaller than chunk size"""
    text = "This is a short document with just a few words."
    res = chunk_func({"input": text})
    assert res["num_chunks"] == 1
    assert len(res["output"]) == 1
    assert res["output"][0] == text

def test_chunk_with_overlap():
    """Test that chunks have proper overlap of 100 tokens"""
    # Create text with 600 words
    text = ' '.join([f'word{i}' for i in range(1, 601)])
    res = chunk_func({"input": text})

    # Should create 2 chunks (0-500, 400-600)
    assert res["num_chunks"] == 2
    assert len(res["output"]) == 2

    # Verify chunk sizes
    chunk1_tokens = res["output"][0].split()
    chunk2_tokens = res["output"][1].split()
    assert len(chunk1_tokens) == 500
    assert len(chunk2_tokens) == 200

    # Verify overlap: last 100 of chunk1 should match first 100 of chunk2
    overlap1 = chunk1_tokens[-100:]
    overlap2 = chunk2_tokens[:100]
    assert overlap1 == overlap2

def test_chunk_parameters():
    """Test that chunking uses correct parameters (500/100)"""
    # Create text with exactly 900 words
    text = ' '.join([f'w{i}' for i in range(900)])
    res = chunk_func({"input": text})

    # With chunk_size=500, overlap=100, step=400:
    # Chunk 1: 0-500 (500 tokens)
    # Chunk 2: 400-900 (500 tokens)
    # Chunk 3: 800-900 (100 tokens)
    assert res["num_chunks"] == 3
    assert len(res["output"][0].split()) == 500
    assert len(res["output"][1].split()) == 500
    assert len(res["output"][2].split()) == 100
