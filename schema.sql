CREATE TABLE users (
    user_id BIGINT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    nickname VARCHAR(255) NOT NULL
);

CREATE TABLE messages (
    message_id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    channel_id BIGINT NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    message_content TEXT NOT NULL,
    message_timestamp TIMESTAMP NOT NULL
);