import sqlite3
import os

DB_PATH_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "claimguard.db"))
DB_PATH_BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "claimguard.db"))

def migrate_db(db_path):
    print(f"Checking database columns at: {db_path}")
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}, skipping.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Columns to check for `claims` table
    claims_columns = [
        ("claim_type", "VARCHAR(50) DEFAULT 'Reimbursement'"),
        ("hospital_name", "VARCHAR(200) DEFAULT 'Apollo Multispeciality Hospital'"),
        ("hospital_type", "VARCHAR(50) DEFAULT 'Network Hospital'"),
        ("admission_date", "VARCHAR(50)"),
        ("discharge_date", "VARCHAR(50)"),
        ("emergency_or_planned", "VARCHAR(50) DEFAULT 'Planned Treatment'"),
        ("bank_account_holder", "VARCHAR(150)"),
        ("bank_account_number", "VARCHAR(50)"),
        ("bank_ifsc", "VARCHAR(50)"),
        ("pan_number", "VARCHAR(50)"),
        ("doctor_name", "VARCHAR(150)"),
        ("pre_auth_number", "VARCHAR(50)"),
    ]

    cursor.execute("PRAGMA table_info(claims)")
    existing_claims_cols = [row[1] for row in cursor.fetchall()]

    for col_name, col_def in claims_columns:
        if col_name not in existing_claims_cols:
            print(f"Adding column '{col_name}' to claims table...")
            try:
                cursor.execute(f"ALTER TABLE claims ADD COLUMN {col_name} {col_def}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")

    # Columns to check for `claim_documents` table
    docs_columns = [
        ("format_valid", "BOOLEAN DEFAULT 1"),
        ("is_required", "BOOLEAN DEFAULT 1"),
    ]

    cursor.execute("PRAGMA table_info(claim_documents)")
    existing_docs_cols = [row[1] for row in cursor.fetchall()]

    for col_name, col_def in docs_columns:
        if col_name not in existing_docs_cols:
            print(f"Adding column '{col_name}' to claim_documents table...")
            try:
                cursor.execute(f"ALTER TABLE claim_documents ADD COLUMN {col_name} {col_def}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")

    conn.commit()
    conn.close()
    print("Migration completed successfully for:", db_path)

def migrate():
    migrate_db(DB_PATH_ROOT)
    migrate_db(DB_PATH_BACKEND)

if __name__ == "__main__":
    migrate()
