const pgp = require("pg-promise")();
require("dotenv").config();

const { DATABASE_URL, PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD } =
	process.env;
const cn = DATABASE_URL
	? {
			connectionString: DATABASE_URL,
			max: 30,
			ssl: { rejectUnauthorized: false },
	  }
	: {
			host: PG_HOST,
			port: PG_PORT,
			database: PG_DATABASE,
			user: PG_USER,
			password: PG_PASSWORD,
	  };
const db = pgp(cn);

db.connect()
	.then((cn) => {
		const { user, host, port, database } = cn.client;
		console.log(
			"\x1b[90m" +
				`Postgres connection established with user:${user}, host:${host}, port:${port}, database:${database}` +
				"\x1b[0m"
		);
		cn.done();
	})
	.catch((error) => {
		console.log("Database connection error", error);
	});

module.exports = db;
