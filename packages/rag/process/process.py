"""
Process chunks into question-answer pairs using OpenAI API.
Saves the Q&A pairs to S3.
"""
import os
import json
import boto3
from openai import OpenAI

def process(args):
    """
    Transform a text chunk into a question-answer pair using LLM.

    Args:
        args: dict with 'input' (chunk text) and OpenAI/S3 credentials

    Returns:
        dict with 'user' (question), 'assistant' (answer), and 's3_key' if stored
    """
    input_text = args.get("input", "")

    if not input_text:
        return {"user": "", "assistant": ""}

    # Get OpenAI configuration
    api_key = args.get("OPENAI_API_KEY", os.getenv("OPENAI_API_KEY", "dummy"))
    base_url = args.get("OPENAI_BASE_URL", os.getenv("OPENAI_BASE_URL"))
    model = args.get("OPENAI_MODEL", os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"))

    # Generate Q&A pair using LLM
    try:
        client = OpenAI(api_key=api_key, base_url=base_url)

        prompt = f"""Based on the following text chunk, generate a question and answer pair.
The question should be something that this text chunk can answer.
The answer should be based on the information in the text.

Text chunk:
{input_text}

Respond in JSON format with "question" and "answer" fields."""

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates question-answer pairs from text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )

        # Parse response
        response_text = response.choices[0].message.content

        # Try to parse as JSON
        try:
            qa_data = json.loads(response_text)
            question = qa_data.get("question", "")
            answer = qa_data.get("answer", "")
        except json.JSONDecodeError:
            # Fallback: use simple extraction
            question = f"What information is provided in this text?"
            answer = input_text[:200] + "..." if len(input_text) > 200 else input_text

    except Exception as e:
        # Fallback if LLM fails
        print(f"Warning: LLM processing failed: {e}")
        question = f"What is the content of this chunk?"
        answer = input_text[:200] + "..." if len(input_text) > 200 else input_text

    qa_pair = {
        "user": question,
        "assistant": answer
    }

    # Store in S3 if credentials provided
    s3_key = None
    if args.get("S3_HOST"):
        s3_key = store_qa_in_s3(qa_pair, input_text, args)

    return {
        **qa_pair,
        "s3_key": s3_key
    }


def store_qa_in_s3(qa_pair, original_text, args):
    """
    Store Q&A pair in S3 as JSON.

    Args:
        qa_pair: dict with 'user' and 'assistant' keys
        original_text: original chunk text
        args: dict with S3 credentials

    Returns:
        S3 key where Q&A is stored
    """
    try:
        # Get S3 configuration
        host = args.get("S3_HOST", os.getenv("S3_HOST"))
        port = args.get("S3_PORT", os.getenv("S3_PORT"))
        s3_url = f"http://{host}:{port}"
        access_key = args.get("S3_ACCESS_KEY", os.getenv("S3_ACCESS_KEY"))
        secret_key = args.get("S3_SECRET_KEY", os.getenv("S3_SECRET_KEY"))
        bucket = args.get("S3_BUCKET_DATA", os.getenv("S3_BUCKET_DATA"))

        # Initialize S3 client
        s3_client = boto3.client(
            's3',
            region_name='us-east-1',
            endpoint_url=s3_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key
        )

        # Generate S3 key
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        s3_key = f"qa_pairs/qa_{timestamp}.json"

        # Store Q&A pair with metadata
        qa_data = {
            "question": qa_pair["user"],
            "answer": qa_pair["assistant"],
            "original_chunk": original_text,
            "timestamp": timestamp
        }

        s3_client.put_object(
            Bucket=bucket,
            Key=s3_key,
            Body=json.dumps(qa_data, indent=2).encode('utf-8'),
            ContentType='application/json'
        )

        return s3_key

    except Exception as e:
        print(f"Warning: Failed to store Q&A in S3: {e}")
        return None
