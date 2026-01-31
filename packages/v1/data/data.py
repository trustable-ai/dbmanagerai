import os
import json
import psycopg


def get_db_connection(args):
    """Get database connection from POSTGRES_URL parameter or environment"""
    dburl = args.get("POSTGRES_URL", os.getenv("POSTGRES_URL"))
    if not dburl:
        raise ValueError("POSTGRES_URL not configured")
    return psycopg.connect(dburl)


def json_response(data, status_code=200):
    """Helper to format JSON responses"""
    return (json.dumps(data), "application/json", status_code)


def text_response(text, status_code=200):
    """Helper to format text/plain responses"""
    return (text, "text/plain", status_code)


def destroy(args):
    """Drop the pim.data table - requires safety checks"""
    # Check that it's NOT called from the web
    if "__ow_method" in args:
        return json_response({"error": "destroy operation cannot be called from web"}, 403)

    # Check for confirmation field
    if args.get("do-i-know-i-lose-data") != "yes":
        return json_response({"error": "destroy requires 'do-i-know-i-lose-data' field set to 'yes'"}, 400)

    conn = get_db_connection(args)
    try:
        with conn.cursor() as cur:
            cur.execute("DROP TABLE IF EXISTS pim.data")
            conn.commit()
        return json_response({"ok": True})
    finally:
        conn.close()


def setup(args):
    """Create pim schema and data table"""
    # Check that it's NOT called from the web
    if "__ow_method" in args:
        return json_response({"error": "setup operation cannot be called from web"}, 403)

    conn = get_db_connection(args)
    try:
        with conn.cursor() as cur:
            # Create schema if it doesn't exist
            cur.execute("CREATE SCHEMA IF NOT EXISTS pim")

            # Check if table already exists
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'pim'
                    AND table_name = 'data'
                )
            """)
            table_exists = cur.fetchone()[0]

            if table_exists:
                return json_response({"ok": True, "warning": "Table pim.data already exists"})

            # Create table with id (text up to 256 chars, NOT unique) and data (text up to 64k)
            cur.execute("""
                CREATE TABLE pim.data (
                    id VARCHAR(256),
                    data TEXT CHECK (length(data) <= 65536)
                )
            """)
            conn.commit()
        return json_response({"ok": True})
    finally:
        conn.close()


def save_data(args):
    """Save data with id and data fields - allows multiple records with same id"""
    id_value = args.get("id")
    data_value = args.get("data")

    if not id_value:
        return json_response({"error": "id field is required"}, 400)

    if not data_value:
        return json_response({"error": "data field is required"}, 400)

    conn = get_db_connection(args)
    try:
        with conn.cursor() as cur:
            # Simple INSERT - allows multiple records with the same id
            cur.execute("""
                INSERT INTO pim.data (id, data)
                VALUES (%s, %s)
            """, (id_value, data_value))
            conn.commit()
        return json_response({"ok": True})
    finally:
        conn.close()


def load_data(args):
    """Load data by id and return as array"""
    id_value = args.get("id")

    if not id_value:
        return json_response({"error": "id field is required"}, 400)

    conn = get_db_connection(args)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT data FROM pim.data WHERE id = %s", (id_value,))
            rows = cur.fetchall()
            # Return array of data values
            data_array = [row[0] for row in rows]
        return json_response({"data": data_array})
    finally:
        conn.close()


def handle_special_get(args):
    """Special case: GET with __ow_path returns concatenated data as text/plain"""
    path = args.get("__ow_path", "").strip("/")

    if not path:
        return json_response({"error": "Path is empty"}, 400)

    conn = get_db_connection(args)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT data FROM pim.data WHERE id = %s", (path,))
            rows = cur.fetchall()
            # Concatenate all data fields separated by empty line, with newline at end
            result = "\n\n".join(row[0] for row in rows if row[0]) + "\n"
        return text_response(result)
    finally:
        conn.close()


def handle(args):
    """Main handler that routes to appropriate operation"""
    try:
        # Special case: GET method with path
        if args.get("__ow_method") == "get" and args.get("__ow_path"):
            return handle_special_get(args)

        # Get operation from _op field
        op = args.get("_op", "")

        if op == "destroy":
            return destroy(args)
        elif op == "setup":
            return setup(args)
        elif op == "save":
            return save_data(args)
        elif op == "load":
            return load_data(args)
        else:
            return json_response({"error": f"Unknown operation: {op}"}, 400)

    except Exception as e:
        return json_response({"error": str(e)}, 500)

