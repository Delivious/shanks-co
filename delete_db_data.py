import sqlite3
def dbConnection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

with dbConnection() as db_connection:
    db_connection.execute('DELETE FROM users')