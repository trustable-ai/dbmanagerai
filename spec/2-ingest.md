To implement the ingestion
- upload client side the file using s3 
to the s3.<domain> endpoint
- then invoke the function rag/ingest
to perform the extraction
the rag/ingest function can can reach tika
as service tika in the tika namespace
in kubernetes
impplement reading from s3
and then pushing the result to s3
and finally reading it back as a signed
url

Add preview file after upload