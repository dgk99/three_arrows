import { Pool, types } from "pg"

// Keep DATE columns as raw "YYYY-MM-DD" strings instead of Date objects,
// since Date parsing shifts to local midnight and can land on the wrong day.
types.setTypeParser(types.builtins.DATE, (val) => val)

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
