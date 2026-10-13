-- Safety net for deploys: the discovery agent's kill switch now defaults to
-- ON for any newly-created DiscoverySettings row, and this migration also
-- flips the existing singleton row so the very first deploy that runs it
-- leaves all automated discovery runs (admin button and the scheduled
-- route) blocked until an operator explicitly turns the switch off.
ALTER TABLE "DiscoverySettings" ALTER COLUMN "killSwitchEnabled" SET DEFAULT true;
UPDATE "DiscoverySettings" SET "killSwitchEnabled" = true;
