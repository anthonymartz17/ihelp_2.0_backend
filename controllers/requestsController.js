const express = require("express");
const requests = express.Router();
const {
	getAllRequests,
	getRequestById,
	createRequest,
	updateRequest,
	deleteRequest,
	getCurrentAdmin
} = require("../queries/requestsQueries");

requests.get("/", async (req, res) => {
	try {
		const uid = req.user.uid;
	
		const admin = await getCurrentAdmin(uid);
		if (!admin) {
			return res.status(403).json({ message: "Unauthorized" });
		}
		const allRequests = await getAllRequests(admin.organization_id);
		res.status(200).json(allRequests);
	} catch (error) {
		res.status(500).json({ error, message: error.message });
	}
});

requests.get("/:id", async (req, res) => {
	const { id } = req.params;

	try {
		const request = await getRequestById(id);
		if (request) {
			res.status(200).json(request);
		} else {
			res.status(404).json({ error, message: error.message });
		}
	} catch (error) {
		res.status(500).json({ error, message: error.message });
	}
});

requests.post("/", async (req, res) => {
	try {
		const uid = req.user.uid;

		const admin = await getCurrentAdmin(uid);
		if (!admin) {
			return res.status(403).json({ message: "Unauthorized" });
		}
		const result = await createRequest(admin.organization_id, req.body);
		res.status(201).json(result);
	} catch (error) {
		res.status(500).json({ error, message: error.message });
	}
});

requests.put("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await updateRequest(id, req.body);
		res.status(200).json(result);
	} catch (error) {

		res.status(500).json({ error: "Server error" });
	}
});

requests.delete("/:id", async (req, res) => {
	const { id } = req.params;

	try {
		const deletedRequest = await deleteRequest(id);
		if (deletedRequest) {
			res.status(200).json(deletedRequest);
		} else {
			res.status(404).json({ error: "Request not found" });
		}
	} catch (error) {
		res.status(500).json({ error: "Server error" });
	}
});

module.exports = requests;
