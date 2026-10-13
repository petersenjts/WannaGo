-- Captures the real failure message when a discovery run throws before
-- completing (e.g. the Google Places call itself failed), instead of that
-- detail only reaching server logs while the run log shows nothing.
ALTER TABLE "DiscoveryRunLog" ADD COLUMN "errorMessage" TEXT;
