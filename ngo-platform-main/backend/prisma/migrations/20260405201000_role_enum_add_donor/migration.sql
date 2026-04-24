-- prisma:disable-transaction
-- Older databases may lack 'DONOR' on the PostgreSQL Role enum; inserts then fail (generic "Database request failed").
DO $$
DECLARE
  role_oid oid;
  typ        text;
BEGIN
  SELECT t.oid, t.typname::text
  INTO role_oid, typ
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
    AND t.typname IN ('Role', 'role')
    AND t.typtype = 'e'
  ORDER BY CASE WHEN t.typname = 'Role' THEN 0 ELSE 1 END
  LIMIT 1;

  IF role_oid IS NULL THEN
    RAISE NOTICE 'public Role enum not found; skipping DONOR label';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_enum e WHERE e.enumtypid = role_oid AND e.enumlabel = 'DONOR'
  ) THEN
    RETURN;
  END IF;

  EXECUTE format('ALTER TYPE %I.%I ADD VALUE %L', 'public', typ, 'DONOR');
END $$;
