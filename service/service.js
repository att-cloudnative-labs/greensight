const log = require("../lib/log");

/**
 * Service
 */
class Service {
	
	/**
	 * Get a list of items
	 * @return {object} Promise that returns an array of items.
	 */
	findAll(){
		return new Promise( (resolve)=>{
			// Place your business logic here, on success resolve:
			resolve( [] );
			// on failure reject();
		});
	}
	
	/**
	 * Fetch an item by ID
	 * @return {object} Promise that returns an item.
	 */
	findOne( id ){	// NOSONAR need argument
		return new Promise( (resolve)=>{
			// Place your business logic here, on success resolve:
			resolve( {} );
			// on failure reject();
		});
	}
	
	/**
	 * Create an item
	 * @return {object} Promise that returns the created item
	 */
	create( item ){	// NOSONAR need argument
		return new Promise( (resolve)=>{
			// Place your business logic here, on success resolve:
			resolve( {} );
			// on failure reject();
		});
	}
	
	/**
	 * Update an item
	 * @return {object} Promise that returns the updated item
	 */
	update( item ){	// NOSONAR need argument
		return new Promise( (resolve)=>{
			// Place your business logic here, on success resolve:
			resolve( {} );
			// on failure reject();
		});
	}
	
	/**
	 * Remove an item by ID
	 * @return {object} Promise that resolves if the item was deleted or rejects
	 * on error.
	 */
	remove( id ){	// NOSONAR need argument
		return new Promise( (resolve)=>{
			// Place your business logic here, on success resolve:
			resolve( {} );
			// on failure reject();
		});
	}
}
