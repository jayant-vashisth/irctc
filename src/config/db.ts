import { Pool } from "pg";

const pool = new Pool();

export default {
  query: (text: any, params: any) => pool.query(text, params),
};
