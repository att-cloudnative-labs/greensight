const service = require("./service"),
	log = require("../lib/log");

module.exports = function(app) {
	/**
	* @swagger
	* /service:
	*   get:
	*     tags:
	*      - frontend
	*     description: Returns a list of items
	*     summary: Search
	*     produces:
	*       - application/json
	*     responses:
	*       200:
	*         description: Succesful query
	*       500:
	*         description: Generic error
	*/
	app.get("/service", (req, res)=>{
		service.findAll().then( (items)=>{
			res.send( items );
		}).catch( (error)=>{
			log.error( error );
			res.status(500).send(error);
		});
	});
	
	
	/**
	* @swagger
	* /service/{id}:
	*   get:
	*     tags:
	*      - frontend
	*     description: Retrieves an item given an id
	*     summary: Find one
	*     produces:
	*       - application/json
	*     responses:
	*       200:
	*         description: Succesful query
	*       404:
	*         description: Item not found
	*       500:
	*         description: Generic error
	*/
	app.get("/service/:id", (req, res)=>{
		const id = req.params.id;
		service.findOne( id ).then( (item)=>{
			res.send( item );
		}).catch( (error)=>{
			log.error( error );
			res.status(500).send(error);
		});
	 });
	 
	 
	 /**
	* @swagger
	* /service:
	*   post:
	*     tags:
	*      - frontend
	*     description: Create
	*     summary: Create
	*     produces:
	*       - application/json
	*     responses:
	*       201:
	*         description: Item created
	*       500:
	*         description: Generic error
	*/
	app.post("/service", (req, res)=>{
		const item = req.body;
		service.create( item ).then( (item)=>{
			res.status(201).send( item );
		}).catch( (error)=>{
			log.error( error );
			res.status(500).send(error);
		});
	 });
	 
	 
	 /**
	* @swagger
	* /service:
	*   put:
	*     tags:
	*      - frontend
	*     description: Updates an item
	*     summary: Update
	*     produces:
	*       - application/json
	*     responses:
	*       201:
	*         description: Item updated
	*       500:
	*         description: Generic error
	*/
	app.put("/service", (req, res)=>{
		const item = req.body;
		service.update( item ).then( (item)=>{
			res.status(201).send( item );
		}).catch( (error)=>{
			log.error( error );
			res.status(500).send(error);
		});
	 });
	 
	 
	 /**
	* @swagger
	* /service/{id}:
	*   delete:
	*     tags:
	*      - frontend
	*     description: Deletes an item given an id
	*     summary: Remove
	*     produces:
	*       - application/json
	*     responses:
	*       204:
	*         description: Succesfully deleted
	*       404:
	*         description: Item not found
	*       500:
	*         description: Generic error
	*/
	app.delete("/service/:id", (req, res)=>{
		const id = req.params.id;
		service.remove( id ).then( (item)=>{
			res.status(204).send( item );
		}).catch( (error)=>{
			log.error( error );
			res.status(500).send(error);
		});
	 });
};
