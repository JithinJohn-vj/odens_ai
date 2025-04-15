import os
import sqlite3
import time

def remove_db():
    # Remove database file if it exists
    if os.path.exists('quote_ai.db'):
        try:
            # Connect to database
            conn = sqlite3.connect('quote_ai.db')
            cursor = conn.cursor()
            
            # Get list of all tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            
            # Drop each table
            cursor.execute("PRAGMA foreign_keys=off;")
            for table in tables:
                cursor.execute(f"DROP TABLE IF EXISTS {table[0]};")
            cursor.execute("PRAGMA foreign_keys=on;")
            
            # Commit changes and close connection
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error while dropping tables: {e}")
            pass
        
        # Try to remove the file
        try:
            os.remove('quote_ai.db')
        except PermissionError:
            time.sleep(1)
            try:
                os.remove('quote_ai.db')
            except:
                pass
        except Exception as e:
            print(f"Error while removing database file: {e}")
            pass

    # Remove journal and wal files
    for ext in ['-journal', '-wal']:
        if os.path.exists(f'quote_ai.db{ext}'):
            try:
                os.remove(f'quote_ai.db{ext}')
            except Exception as e:
                print(f"Error while removing {ext} file: {e}")
                pass

# Remove all database files
remove_db()

print("Database has been reset successfully.") 