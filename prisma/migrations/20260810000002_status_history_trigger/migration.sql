-- Enforce, at the database layer, that current_status can never change
-- (including on initial creation) without a matching row being written
-- to complaint_status_history. This makes the invariant "history is
-- never silently bypassed" hold even for code paths nobody wrote
-- through the shared application function (bulk scripts, manual
-- console queries, future admin tooling, etc).
--
-- changed_by and remarks aren't available to a trigger from the row
-- data alone, so the application sets two transaction-local session
-- variables immediately before the INSERT/UPDATE, inside the same
-- transaction:
--
--   SET LOCAL app.current_user_id = '<uuid>';
--   SET LOCAL app.status_remarks  = 'optional free text';
--
-- See src/lib/db.ts (withActor) for the helper that does this.

CREATE OR REPLACE FUNCTION log_complaint_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_actor  TEXT;
  v_remarks TEXT;
BEGIN
  -- current_setting(..., true) returns NULL instead of erroring when unset
  v_actor   := NULLIF(current_setting('app.current_user_id', true), '');
  v_remarks := NULLIF(current_setting('app.status_remarks', true), '');

  IF TG_OP = 'INSERT' THEN
    INSERT INTO complaint_status_history
      (id, complaint_id, previous_status, new_status, remarks, changed_by, created_at)
    VALUES
      (gen_random_uuid(), NEW.id, NULL, NEW.current_status, v_remarks, v_actor, NOW());
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.current_status IS DISTINCT FROM NEW.current_status THEN
    INSERT INTO complaint_status_history
      (id, complaint_id, previous_status, new_status, remarks, changed_by, created_at)
    VALUES
      (gen_random_uuid(), NEW.id, OLD.current_status, NEW.current_status, v_remarks, v_actor, NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- gen_random_uuid() lives in pgcrypto on older Postgres; harmless no-op on 13+.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TRIGGER IF EXISTS trg_complaint_status_insert ON complaints;
CREATE TRIGGER trg_complaint_status_insert
  AFTER INSERT ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION log_complaint_status_change();

DROP TRIGGER IF EXISTS trg_complaint_status_update ON complaints;
CREATE TRIGGER trg_complaint_status_update
  AFTER UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION log_complaint_status_change();
