-- 004_blocks.sql
-- 5-hour billing blocks tracking

CREATE TABLE blocks (
    id BIGSERIAL PRIMARY KEY,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    block_start TIMESTAMPTZ NOT NULL,
    block_end TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_gap BOOLEAN DEFAULT false,
    input_tokens BIGINT DEFAULT 0,
    output_tokens BIGINT DEFAULT 0,
    cache_creation_tokens BIGINT DEFAULT 0,
    cache_read_tokens BIGINT DEFAULT 0,
    total_tokens BIGINT DEFAULT 0,
    cost_usd NUMERIC(10, 4) DEFAULT 0,
    models TEXT[],
    duration_minutes INTEGER,
    entries INTEGER DEFAULT 0,
    UNIQUE(machine_id, block_start)
);

CREATE INDEX idx_blocks_machine ON blocks(machine_id);
CREATE INDEX idx_blocks_start ON blocks(block_start DESC);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own blocks" ON blocks FOR SELECT
    USING (machine_id IN (SELECT machine_id FROM machine_owners WHERE user_id = auth.uid()));
