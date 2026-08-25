import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

function capitalizeFirst(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function deriveNameFromEmail(email) {
  const prefix = email.split("@")[0];
  const cleaned = prefix.replace(/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ0-9]/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "Usuario";
  }

  return parts.map(capitalizeFirst).join(" ");
}

async function backfillNames() {
  const client = await pool.connect();

  try {
    const { rows: usersWithoutName } = await client.query(
      `SELECT id, email FROM "user" WHERE name IS NULL OR name = ''`
    );

    console.log(`Found ${usersWithoutName.length} users without name.`);

    if (usersWithoutName.length === 0) {
      console.log("No users to backfill. Exiting.");
      return;
    }

    let updated = 0;

    for (const user of usersWithoutName) {
      const derivedName = deriveNameFromEmail(user.email);

      await client.query(
        `UPDATE "user" SET name = $1 WHERE id = $2`,
        [derivedName, user.id]
      );

      updated++;
    }

    console.log(`\nBackfill complete. Updated ${updated} users.`);
  } catch (error) {
    console.error("Backfill failed:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

backfillNames();
