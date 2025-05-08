const db = require("../db/db-config.js");

function getCurrentAdmin(uid) {
	return db.oneOrNone("SELECT * FROM admins WHERE uid = $1", [uid]);
}

const getAllVolunteers = async (organization_id) => {
	try {
		const allVolunteers = await db.any(
			`
      SELECT 
        volunteers.uid,
        volunteers.id,
        volunteers.organization_id,
        volunteers.name,
        volunteers.email,
        volunteers.age,
        volunteers.points_earned,
        volunteers.created_at,
        volunteers.updated_at,
        volunteers.is_active
      FROM volunteers
      WHERE volunteers.organization_id = $1
      `,
			[organization_id]
		);

		return allVolunteers;
	} catch (error) {
		throw new Error("Server error");
	}
};

const getVolunteerById = async (id) => {
	try {
		const volunteer = await db.one("SELECT * FROM volunteers WHERE id=$1", id);
		return volunteer;
	} catch (error) {
		throw error;
	}
};

const createVolunteer = async (volunteer) => {
	const { organization_id, name, email, age } = volunteer;

	try {
		const newVolunteer = await db.one(
			"INSERT INTO volunteers (organization_id, name, email, age) VALUES($1, $2, $3, $4) RETURNING *",
			[organization_id, name, email, age]
		);
		return newVolunteer;
	} catch (error) {
		throw error;
	}
};

const deleteVolunteer = async (id) => {
	try {
		const deletedVolunteer = await db.one(
			"DELETE FROM volunteers WHERE id = $1 RETURNING *",
			id
		);
		return deletedVolunteer;
	} catch (error) {
		throw error;
	}
};

const updateVolunteer = async (id, volunteer) => {
	const { organization_id, name, email, age } = volunteer;

	try {
		const updatedVolunteer = await db.one(
			"UPDATE volunteers SET organization_id=$1, name=$2, email=$3, age=$4  WHERE id=$5 RETURNING *",
			[organization_id, name, email, age, id]
		);
		return updatedVolunteer;
	} catch (error) {
		throw error;
	}
};

module.exports = {
	getAllVolunteers,
	getVolunteerById,
	createVolunteer,
	deleteVolunteer,
	updateVolunteer,
	getCurrentAdmin,
};
