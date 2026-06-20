CREATE TABLE x_bot_posts (
  id        BIGSERIAL PRIMARY KEY,
  trade_id  TEXT        NOT NULL UNIQUE,
  tweet_id  TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX x_bot_posts_posted_at ON x_bot_posts (posted_at DESC);
