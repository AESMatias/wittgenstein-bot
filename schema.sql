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

-- General config (like config/generalConfig.json)
CREATE TABLE IF NOT EXISTS config (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT
);

INSERT INTO secret_channels (channel_name) VALUES
  ('secret'),
  ('toma_de_ramos'),
  ('private')
  ON CONFLICT (channel_name) DO NOTHING;;

INSERT INTO config (key, value) VALUES
  ('global_logs', 'true'),
  ('total_queries', '1')
  ON CONFLICT (key) DO NOTHING;;
