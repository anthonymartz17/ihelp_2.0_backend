const db = require("../db/db-config.js");

function getCurrentAdmin(uid) {
	console.log("uid", uid);
	return db.oneOrNone("SELECT * FROM admins WHERE uid = $1", [uid]);
}

const getAllRequesters = async (organization_id) => {
	try {
		const allRequesters = await db.any(
			`
      SELECT 
        requesters.id,
        requesters.first_name,
        requesters.last_name,
        requesters.phone,
        requesters.created_at,
        requesters.updated_at
      FROM requesters
      WHERE requesters.organization_id = $1
      `,
			[organization_id]
		);

		return allRequesters;
	} catch (error) {
		throw error;
	}
};

const getRequesterById = async (id) => {
	try {
		const requester = await db.one("SELECT * FROM requesters WHERE id=$1", id);
		return requester;
	} catch (error) {
		throw error;
	}
};

const createRequester = async (organization_id, { name, phone }) => {
	try {
		const newRequester = await db.one(
			"INSERT INTO requesters (name, phone, organization_id) VALUES($1, $2, $3) RETURNING *",
			[name, phone, organization_id]
		);
		return newRequester;
	} catch (error) {
		throw error;
	}
};

const deleteRequester = async (id) => {
	try {
		const deletedRequester = await db.one(
			"DELETE FROM requesters WHERE id = $1 RETURNING *",
			id
		);
		return deletedRequester;
	} catch (error) {
		throw error;
	}
};

const updateRequester = async (id, requester) => {
	const { name, phone, organization_id } = requester;

	try {
		const updatedRequester = await db.one(
			"UPDATE requesters SET name=$1, phone=$2, organization_id=$3 WHERE id=$4 RETURNING *",
			[name, phone, organization_id, id]
		);
		return updatedRequester;
	} catch (error) {
		throw error;
	}
};

module.exports = {
	getAllRequesters,
	getRequesterById,
	createRequester,
	deleteRequester,
	updateRequester,
	getCurrentAdmin,
};
