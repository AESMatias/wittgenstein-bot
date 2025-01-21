CREATE TABLE IF NOT EXISTS secret_channels (
  channel_name VARCHAR(255) PRIMARY KEY
);

-- General config (like config/generalConfig.json)
CREATE TABLE IF NOT EXISTS config (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    nickname VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    message_id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    channel_id BIGINT NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    message_content TEXT NOT NULL,
    message_timestamp TIMESTAMP NOT NULL
);

INSERT INTO secret_channels (channel_name) VALUES
  ('secret'),
  ('toma-de-ramos'),
  ('private')
  ON CONFLICT (channel_name) DO NOTHING;

INSERT INTO config (key, value) VALUES
  ('global_logs', 'true'),
  ('total_queries', '1')
  ON CONFLICT (key) DO NOTHING;

