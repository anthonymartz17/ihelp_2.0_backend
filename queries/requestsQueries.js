const db = require("../db/db-config.js");

function getCurrentAdmin(uid) {
	return db.oneOrNone("SELECT * FROM admins WHERE uid = $1", [uid]);
}

const getAllRequests = async (organization_id) => {
	try {
		const allRequests = await db.any(
			`
			SELECT 
			requests.id,
			requests.organization_id,
			requests.requester_id,
			categories.id AS category_id,
			categories.name AS category_name,
			requesters.first_name AS requester_first_name,
			requesters.last_name AS requester_last_name,
			requests.due_date,
			requests.status_id,
			requests.event_time,
			request_status.name AS status_name,
			requests.description,
			CAST(COUNT(DISTINCT request_task.id)AS INTEGER) AS total_tasks,        
			CAST(COUNT(DISTINCT assigned_tasks.request_task_id) AS INTEGER ) AS assigned_tasks,
			requests.created_at,
			requests.updated_at
	FROM requests
	LEFT JOIN categories ON requests.category_id = categories.id
	LEFT JOIN requesters ON requests.requester_id = requesters.id
	LEFT JOIN request_status ON requests.status_id = request_status.id
	LEFT JOIN request_task ON requests.id = request_task.request_id     
	LEFT JOIN assigned_tasks ON request_task.id = assigned_tasks.request_task_id
	WHERE requests.organization_id = $1
	GROUP BY 
			requests.id,
			requests.organization_id,
			requests.requester_id,
			requesters.first_name,
			requesters.last_name,
			requests.status_id,
			request_status.name,
			requests.description,
			categories.id,
			requests.created_at,
			requests.updated_at;
	
      `,
			[organization_id]
		);

		return allRequests;
	} catch (error) {
		throw error;
	}
};

const getRequestById = async (id) => {
	try {
		const requestWithTasks = await db.oneOrNone(
			`
			SELECT 
				requests.id,
				requests.organization_id,
				requests.requester_id,
				requests.hours_needed,
        requests.event_time,
				categories.id AS category_id,
				categories.name AS category_name,
				requesters.first_name AS requester_first_name,
				requesters.last_name AS requester_last_name,
				requesters.phone AS requester_phone,
				requests.status_id,
				request_status.name AS status_name,
				requests.due_date,
				requests.description,
				COUNT(DISTINCT request_task.id) AS total_tasks,
				COUNT(DISTINCT assigned_tasks.request_task_id) AS assigned_tasks,
				requests.created_at,
				requests.updated_at,
				json_agg(
					json_build_object(
						'id', request_task.id,
						'task', request_task.task,
						'due_date', request_task.due_date,
						'point_earnings', request_task.point_earnings,
						'volunteer_id', volunteers.id,
						'volunteer_avatar', avatars.img_url,
						'volunteer_name', volunteers.name,
						'volunteer_email', volunteers.email,
						'task_progress', task_progress.name,
						'task_progress_id', task_progress.id,
						'task_status_name', task_status.name,
						'task_status_id', request_task.task_status_id
					)
				) AS tasks
			FROM requests
			LEFT JOIN categories ON requests.category_id = categories.id
			LEFT JOIN requesters ON requests.requester_id = requesters.id
			LEFT JOIN request_status ON requests.status_id = request_status.id
			LEFT JOIN request_task ON requests.id = request_task.request_id     
			LEFT JOIN assigned_tasks ON request_task.id = assigned_tasks.request_task_id
			LEFT JOIN volunteers ON assigned_tasks.volunteer_id = volunteers.id
			LEFT JOIN avatars ON volunteers.avatar_id = avatars.id
			LEFT JOIN task_progress ON assigned_tasks.task_progress_id = task_progress.id
			LEFT JOIN task_status ON request_task.task_status_id = task_status.id
			WHERE requests.id = $1
			GROUP BY 
				requests.id,
				requests.organization_id,
				requests.requester_id,
				requests.hours_needed,
        requests.event_time,
				requesters.first_name,
				requesters.last_name,
				requesters.phone,
				requests.status_id,
				request_status.name,
				requests.description,
				categories.id,
				requests.created_at,
				requests.updated_at
			`,
			[id]
		);

		if (!requestWithTasks) {
			throw new Error("Request not found");
		}

		return requestWithTasks;
	} catch (error) {
		throw error;
	}
};

const createRequest = async (
	organization_id,
	{
		category_id,
		due_date,
		description,
		hours_needed,
		requester_id,
		tasks,
		event_time,
	}
) => {
	try {
		const newRequest = await db.one(
			`INSERT INTO requests 
			(organization_id, requester_id, status_id, description, hours_needed, category_id, due_date,event_time) 
			VALUES 
			($1, $2, $3, $4, $5, $6, $7,$8) 
			RETURNING *`,
			[
				organization_id,
				requester_id,
				1,
				description,
				hours_needed,
				category_id,
				due_date,
				event_time,
			]
		);

		const taskPromises = tasks.map((task) =>
			db.one(
				`INSERT INTO request_task 
		  (requester_id, organization_id, request_id, point_earnings, task, due_date,task_status_id) 
		  VALUES 
		  ($1, $2, $3, $4, $5, $6,$7) 
		  RETURNING id`,
				[
					requester_id,
					organization_id,
					newRequest.id,
					parseInt(task.point_earnings, 10),
					task.task,
					due_date,
					1,
				]
			)
		);

		const insertedTasks = await Promise.all(taskPromises);

		return { ...newRequest, tasks: insertedTasks };
	} catch (error) {
		throw new Error(`Failed to create request: ${error.message}`);
	}
};

const updateRequest = async (id, updates) => {
	const {
		requester_id,
		volunteer_id,
		organization_id,
		status_id,
		description,
		due_date,
		hours_needed,
		tasks,
		event_time,
	} = updates;

	try {
		const existingRequest = await db.oneOrNone(
			"SELECT id FROM requests WHERE id = $1",
			[id]
		);

		if (!existingRequest) {
			throw new Error(`Request with id ${id} not found`);
		}

		const fields = [];
		const values = [];
		let index = 1;

		if (requester_id)
			fields.push(`requester_id = $${index++}`) && values.push(requester_id);
		if (volunteer_id)
			fields.push(`volunteer_id = $${index++}`) && values.push(volunteer_id);
		if (organization_id)
			fields.push(`organization_id = $${index++}`) &&
				values.push(organization_id);
		if (status_id)
			fields.push(`status_id = $${index++}`) && values.push(status_id);
		if (description)
			fields.push(`description = $${index++}`) && values.push(description);
		if (due_date)
			fields.push(`due_date = $${index++}`) && values.push(due_date);
		if (hours_needed)
			fields.push(`hours_needed = $${index++}`) && values.push(hours_needed);
		fields.push(`updated_at = NOW()`);

		const query = `UPDATE requests SET ${fields.join(
			", "
		)} WHERE id = $${index} RETURNING *`;
		values.push(id);

		const updatedRequest = await db.one(query, values);
		return updatedRequest;
	} catch (error) {
		throw new Error(`Failed to update request: ${error.message}`);
	}
};

const deleteRequest = async (id) => {
	try {
		const deletedRequest = await db.one(
			"DELETE FROM requests WHERE id=$1 RETURNING *",
			id
		);
		return deletedRequest;
	} catch (error) {
		throw error;
	}
};

module.exports = {
	getCurrentAdmin,
	getAllRequests,
	getRequestById,
	createRequest,
	updateRequest,
	deleteRequest,
};
