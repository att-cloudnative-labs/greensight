var system = require("./controllers/system"),
    version= require("./controllers/version");

module.exports = function(app) {
	/**
	 * @swagger
	 * /health:
	 *   get:
	 *     tags:
	 *      - Service management
	 *     description: Returns system health
	 *     summary: Service health information
	 *     produces:
	 *       - application/json
	 *     responses:
	 *       200:
	 *         description: status
	 */
	app.get("/health", system.status);
	app.get("/info", version.status);
};
