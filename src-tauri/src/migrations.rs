use tauri_plugin_sql::{Migration, MigrationKind};

pub fn migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_schema",
            kind: MigrationKind::Up,
            sql: r#"
                CREATE TABLE habits (
                    id            TEXT PRIMARY KEY,
                    name          TEXT NOT NULL,
                    type          TEXT NOT NULL CHECK (type IN ('build', 'quit', 'achieve')),
                    created_at    TEXT NOT NULL,
                    archived_at   TEXT,
                    cadence       TEXT CHECK (cadence IN ('daily', 'weekly')),
                    weekly_target INTEGER,
                    target_value  REAL,
                    target_unit   TEXT,
                    deadline      TEXT,
                    notes         TEXT
                );

                CREATE TABLE logs (
                    id         TEXT PRIMARY KEY,
                    habit_id   TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
                    date       TEXT NOT NULL,
                    status     TEXT NOT NULL CHECK (status IN ('hit', 'partial', 'miss')),
                    value      REAL,
                    note       TEXT,
                    created_at TEXT NOT NULL,
                    UNIQUE(habit_id, date)
                );
                CREATE INDEX idx_logs_habit_date ON logs(habit_id, date);

                CREATE TABLE non_negotiables (
                    id          TEXT PRIMARY KEY,
                    text        TEXT NOT NULL,
                    created_at  TEXT NOT NULL,
                    archived_at TEXT
                );

                CREATE TABLE violations (
                    id                TEXT PRIMARY KEY,
                    non_negotiable_id TEXT NOT NULL REFERENCES non_negotiables(id) ON DELETE CASCADE,
                    date              TEXT NOT NULL,
                    note              TEXT,
                    created_at        TEXT NOT NULL
                );
                CREATE INDEX idx_violations_nn_date ON violations(non_negotiable_id, date);

                CREATE TABLE verses (
                    id         TEXT PRIMARY KEY,
                    text       TEXT NOT NULL,
                    reference  TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE settings (
                    key   TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
            "#,
        },
        Migration {
            version: 2,
            description: "seed_demo_data",
            kind: MigrationKind::Up,
            sql: r#"
                INSERT INTO habits (id, name, type, created_at, cadence, weekly_target) VALUES
                    ('seed-h-pray', 'Morning prayer',  'build', '2026-04-01T00:00:00Z', 'daily',  NULL),
                    ('seed-h-read', 'Read for 20 min', 'build', '2026-04-01T00:00:00Z', 'weekly', 5);

                INSERT INTO habits (id, name, type, created_at) VALUES
                    ('seed-h-doom', 'Doomscrolling', 'quit', '2026-04-01T00:00:00Z');

                INSERT INTO habits (id, name, type, created_at, target_value, target_unit, deadline) VALUES
                    ('seed-h-bible', 'Read the Bible cover-to-cover', 'achieve', '2026-04-01T00:00:00Z', 1189.0, 'chapters', '2026-12-31');

                INSERT INTO logs (id, habit_id, date, status, created_at) VALUES
                    ('seed-l-pray-1',  'seed-h-pray', '2026-04-15', 'hit',     '2026-04-15T08:00:00Z'),
                    ('seed-l-pray-2',  'seed-h-pray', '2026-04-16', 'hit',     '2026-04-16T08:00:00Z'),
                    ('seed-l-pray-3',  'seed-h-pray', '2026-04-17', 'partial', '2026-04-17T08:00:00Z'),
                    ('seed-l-pray-4',  'seed-h-pray', '2026-04-18', 'hit',     '2026-04-18T08:00:00Z'),
                    ('seed-l-pray-5',  'seed-h-pray', '2026-04-19', 'miss',    '2026-04-19T08:00:00Z'),
                    ('seed-l-pray-6',  'seed-h-pray', '2026-04-20', 'hit',     '2026-04-20T08:00:00Z'),
                    ('seed-l-pray-7',  'seed-h-pray', '2026-04-22', 'hit',     '2026-04-22T08:00:00Z'),
                    ('seed-l-pray-8',  'seed-h-pray', '2026-04-23', 'hit',     '2026-04-23T08:00:00Z'),
                    ('seed-l-pray-9',  'seed-h-pray', '2026-04-24', 'partial', '2026-04-24T08:00:00Z'),
                    ('seed-l-pray-10', 'seed-h-pray', '2026-04-25', 'hit',     '2026-04-25T08:00:00Z');

                INSERT INTO logs (id, habit_id, date, status, value, created_at) VALUES
                    ('seed-l-bible-1', 'seed-h-bible', '2026-04-15', 'hit', 5, '2026-04-15T22:00:00Z'),
                    ('seed-l-bible-2', 'seed-h-bible', '2026-04-18', 'hit', 3, '2026-04-18T22:00:00Z'),
                    ('seed-l-bible-3', 'seed-h-bible', '2026-04-22', 'hit', 8, '2026-04-22T22:00:00Z');

                INSERT INTO non_negotiables (id, text, created_at) VALUES
                    ('seed-nn-1', 'No phone before sunrise', '2026-04-01T00:00:00Z'),
                    ('seed-nn-2', 'In bed by 11 pm',         '2026-04-01T00:00:00Z');

                INSERT INTO violations (id, non_negotiable_id, date, created_at) VALUES
                    ('seed-vi-1', 'seed-nn-1', '2026-04-12', '2026-04-12T07:30:00Z'),
                    ('seed-vi-2', 'seed-nn-2', '2026-04-19', '2026-04-19T23:45:00Z');

                INSERT INTO verses (id, text, reference, created_at) VALUES
                    ('seed-v-1', 'Be still, and know that I am God.',                          'Psalm 46:10',      '2026-04-01T00:00:01Z'),
                    ('seed-v-2', 'The LORD is my shepherd; I shall not want.',                 'Psalm 23:1',       '2026-04-01T00:00:02Z'),
                    ('seed-v-3', 'I can do all things through Christ who strengthens me.',     'Philippians 4:13', '2026-04-01T00:00:03Z'),
                    ('seed-v-4', 'Cast all your anxiety on him because he cares for you.',     '1 Peter 5:7',      '2026-04-01T00:00:04Z'),
                    ('seed-v-5', 'In quietness and trust shall be your strength.',             'Isaiah 30:15',     '2026-04-01T00:00:05Z');
            "#,
        },
    ]
}
