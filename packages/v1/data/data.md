Implements data.py to manage a table on a Postgres database.

Read args for the informations.

Returl body, statusCode and content type

Check `_op` and decide what to do according the _op

# if _op == 'destroy'

check there is NOT a field `__ow_method` (so is not called from the web)

and there is the the field `do-i-know-i-lose-data` with value `yes`

then drop the table pim.data

return `{"ok": true}` or `{"error": somehting}`

# _op == 'setup'

check there is NOT a field `__ow_method` (so is not called from the web)

Create a schema pim and a table data with fields:
- id is a text filed up to 256 chars - it is not unique
- data can contaiin text up to 64k

Warn if the table already exists

return `{"ok": true}` or `{"error": somehting}`

# _op == 'save'

It will accept a post with the field `id` and `data` to save.

It allows multiple data with the same id

return `{"ok": true}` or `{"error": somehting}`

# if _op == 'load' and the field id is defined

return 
`{
    "data": <array of data>
}`

# special case

if there is `__ow_method` == 'get' and `__ow_path` is not empty
use `__ow_path` as id, 

extract all the fields datata in the database and return the concatenation of the text, separated by an empty line - include a new line at the end

return content type text/plain

