# capacity-planning-simulation
## Synopsis
Prototype Implementation of the CPT System Model and it's Simulation library used by the capacity-planning-backend-model

## Code Examples
    * None

## Dependencies & Prerequisites
    * None
    
## Manual Test Cases
    Debugging Test-Cases:
    ./node_modules/.bin/mocha --require ts-node/register --inspect-brk test/pe-remove-breakdown.spec.ts 

## See Also
    * None
    
## Project Information
**Developers:**

	* Sahar Pure
	* Stephanie Murphy
	* George O'Donnell
	* Ben Willers
	* Huy Quang Pham
	* Adrian O'Connor	
	* Tim Papienski
	
### Build

### Service URL's
Not a service

## Project's CLI Reference

run the service locally:

	* cd capacity-planning-projection
		** npm i
		** tsc
	* cd ../capacity-planning-simulation-types
		** npm i
		** tsc
	* cd ../capacity-planning-simulation-pe-repository
		** npm i
		** tsc
	* cd ../capacity-planning-simulation
		** npm i
		** tsc
	* cd ../capacity-planning-simulation-service
		** npm i
		** npm run-script build
		** node --experimental-worker www.js



## The Processing Element Repository

Informations about the Processing Elements are store along side with their implementation.
To allow for simple use inside the FE this info is mirrored in the PE Repository.
The process to sync the two is semi-manual:

node ./lib/cpt-generate-pe-repository.js > /tmp/repo.json
merge repo.json into pe-repository/src/index.ts
run tsfmt in pe-repository directory.

