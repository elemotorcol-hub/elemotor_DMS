/**
 * Centralises all environment variable loading.
 * Used by ConfigModule.forRoot({ load: [configuration] }).
 */
export default () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'db_elemotor',
    url: process.env.DATABASE_URL ?? '',
  },
});
