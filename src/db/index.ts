import { drizzle } from 'drizzle-orm/node-postgres';
import dotenv from 'dotenv';

import * as schema from './schema';

dotenv.config();

const db = drizzle(process.env.DATABASE_URL!, { schema: schema });

export default db;
