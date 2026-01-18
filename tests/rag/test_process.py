import sys
import json
from unittest.mock import MagicMock, patch
sys.path.insert(0, "packages/rag/process")
from process import process as process_func

def test_process_empty():
    """Test processing with empty input"""
    res = process_func({})
    assert res["user"] == ""
    assert res["assistant"] == ""

def test_process_no_llm_mock():
    """Test processing with fallback when LLM fails"""
    text = "This is a test document about Python programming."

    with patch('process.OpenAI') as mock_openai:
        # Simulate LLM failure
        mock_openai.side_effect = Exception("API error")

        res = process_func({
            "input": text,
            "OPENAI_API_KEY": "dummy"
        })

        assert "user" in res
        assert "assistant" in res
        assert res["user"] != ""
        assert res["assistant"] != ""

def test_process_with_llm_mock():
    """Test processing with successful LLM response"""
    text = "Python is a high-level programming language known for its simplicity."

    with patch('process.OpenAI') as mock_openai:
        # Create mock response
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps({
            "question": "What is Python?",
            "answer": "Python is a high-level programming language known for its simplicity."
        })
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client

        res = process_func({
            "input": text,
            "OPENAI_API_KEY": "dummy",
            "OPENAI_BASE_URL": "http://localhost:11434/v1",
            "OPENAI_MODEL": "gpt-oss:20b"
        })

        assert res["user"] == "What is Python?"
        assert res["assistant"] == "Python is a high-level programming language known for its simplicity."

def test_process_invalid_json_response():
    """Test processing when LLM returns non-JSON response"""
    text = "Machine learning is a subset of artificial intelligence."

    with patch('process.OpenAI') as mock_openai:
        # Create mock response with invalid JSON
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "This is not valid JSON"
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client

        res = process_func({
            "input": text,
            "OPENAI_API_KEY": "dummy"
        })

        # Should fall back to default question/answer
        assert res["user"] == "What information is provided in this text?"
        assert "Machine learning" in res["assistant"]

def test_process_s3_storage_mock():
    """Test that S3 storage is attempted when credentials provided"""
    text = "Test content for S3 storage."

    with patch('process.OpenAI') as mock_openai, \
         patch('process.store_qa_in_s3') as mock_store:

        # Mock LLM response
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = json.dumps({
            "question": "What is the test about?",
            "answer": "S3 storage testing."
        })
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client

        # Mock S3 storage
        mock_store.return_value = "qa_pairs/qa_12345.json"

        res = process_func({
            "input": text,
            "OPENAI_API_KEY": "dummy",
            "S3_HOST": "localhost",
            "S3_PORT": "9000",
            "S3_ACCESS_KEY": "test",
            "S3_SECRET_KEY": "test",
            "S3_BUCKET_DATA": "test-bucket"
        })

        # Verify S3 storage was called
        assert mock_store.called
        assert res["s3_key"] == "qa_pairs/qa_12345.json"

def test_process_truncation():
    """Test that long text is truncated in fallback mode"""
    # Create text longer than 200 characters
    text = "x" * 300

    with patch('process.OpenAI') as mock_openai:
        # Simulate LLM failure
        mock_openai.side_effect = Exception("API error")

        res = process_func({
            "input": text,
            "OPENAI_API_KEY": "dummy"
        })

        # Answer should be truncated to 200 chars + "..."
        assert len(res["assistant"]) == 203
        assert res["assistant"].endswith("...")
