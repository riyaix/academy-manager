CREATE TABLE schema_version (
  version INTEGER PRIMARY KEY NOT NULL,
  description TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE students (
  student_id TEXT PRIMARY KEY NOT NULL,
  guardian_tax_id TEXT,
  guardian_first_name TEXT NOT NULL,
  guardian_last_name TEXT NOT NULL,
  street_type TEXT,
  street_name TEXT,
  street_number TEXT,
  unit_abbreviation TEXT,
  unit_number TEXT,
  floor_number TEXT,
  floor_letter TEXT,
  formatted_address TEXT,
  formatted_unit TEXT,
  postal_code TEXT,
  city TEXT,
  email TEXT,
  phone TEXT,
  student_name TEXT,
  age TEXT,
  enrolled_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  notes TEXT
);

CREATE TABLE courses (
  course_id TEXT PRIMARY KEY NOT NULL,
  course_name TEXT NOT NULL,
  monthly_fee REAL NOT NULL,
  billing_type TEXT NOT NULL CHECK (billing_type IN ('monthly', 'one_time', 'custom')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL
);

CREATE TABLE class_groups (
  class_group_id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  course_id TEXT NOT NULL,
  weekdays_json TEXT NOT NULL DEFAULT '[]',
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  color_class TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  capacity INTEGER,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived')),
  FOREIGN KEY (course_id) REFERENCES courses (course_id)
);

CREATE TABLE enrollments (
  enrollment_id TEXT PRIMARY KEY NOT NULL,
  student_id TEXT NOT NULL,
  class_group_id TEXT NOT NULL,
  enrolled_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  withdrawn_at TEXT,
  FOREIGN KEY (student_id) REFERENCES students (student_id),
  FOREIGN KEY (class_group_id) REFERENCES class_groups (class_group_id)
);

CREATE TABLE payment_records (
  record_id TEXT PRIMARY KEY NOT NULL,
  issued_on TEXT NOT NULL,
  student_id TEXT NOT NULL,
  payer_name TEXT NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'voided')),
  billing_period TEXT,
  payment_method TEXT,
  FOREIGN KEY (student_id) REFERENCES students (student_id)
);

CREATE TABLE payment_record_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  FOREIGN KEY (record_id) REFERENCES payment_records (record_id) ON DELETE CASCADE
);

CREATE TABLE payment_record_counters (
  year INTEGER PRIMARY KEY NOT NULL,
  last_sequence INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE settings_sections (
  section_key TEXT PRIMARY KEY NOT NULL,
  data_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE payment_methods (
  position INTEGER PRIMARY KEY NOT NULL,
  label TEXT NOT NULL
);

CREATE INDEX idx_class_groups_course ON class_groups (course_id);

CREATE INDEX idx_enrollments_student ON enrollments (student_id);

CREATE INDEX idx_enrollments_class_group ON enrollments (class_group_id);

CREATE INDEX idx_payment_records_student ON payment_records (student_id);

CREATE INDEX idx_payment_records_billing_period ON payment_records (billing_period);

CREATE INDEX idx_payment_line_items_record ON payment_record_line_items (record_id);

INSERT INTO schema_version (version, description)
VALUES (1, 'initial_schema');
