Implement chunk using this reference
chunk_size = 500
overlap = 100
step = chunk_size - overlap

for i in range(0, len(tokens), step):
    chunk = tokens[i : i + chunk_size]
    save(chunk)

save the result in S3

Show the chunk block more visible and highlight the overlap in a color like blue or yellow whatever