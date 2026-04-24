-- Admin promotion function
CREATE OR REPLACE FUNCTION make_admin(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users SET is_admin = true WHERE email = user_email;
END;
$$;
