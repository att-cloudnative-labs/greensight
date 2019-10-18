# common-capacity-planning-frontend

## Synopsis

The CPT frontend package contains all Angular7 TypeScript source code files, HTML view templates, Cascading Stylesheet (CSS) theming, TypeScript class definitions, and TypeScript interfaces needed for a generic webserver to serve a web-based GUI to the user. Also contained are the "environment.ts" configuration files needed to specify hostnames for the backend servers that provide the "apiUrl" and "modelApiUrl" REST endpoints for accessing authentication, variable, project, branch, forecasting, simulation, and other model data. 


## Usage Examples


``` http
http://SERVERHOSTNAME:4200
```


## Dependencies & Prerequisites
The following additional decoupled in-house developed backend components are required for operation & development (each of which are contained in a separate source repository):

	capacity-planning-backend-model
	capacity-planning-simulation

Third party-libraries:

	Angular7
	Google Material Design Widget Set
	tsfmt
	Node.js

For Development / Deployment infrastructure:

	An HTML5 Web Browser (for usage)
	Backend Web Server
	Docker


## Project Information
**Developers:**

	- Pure, Sahar
	- Murphy, Stephanie
	- O'Donnell, George
	- Willers, Ben
	- Quang Pham, Huy
	- O'Connor, Adrian
	- Papienski, Tim
	- Schal, Pete

## Build locally:
	1- preparing database
		* start mongoDB server
			** add 'cpt' db
		 	** cd capacity-planning-backend-model/scripts
			 	*** 01-create-admin-user.py
				*** 02-create-root-tree-node.py
				*** 03-create-forecast-root-node.py

	2- build backend service
		* open a terminal & cd capacity-planning-backend-model
			** mvn clean install -DskipTests spring-boot:run

	3- build simulation service:
		* open another terminal & cd capacity-planning-simulation/
		* follow capacity-planning-simulation/README.md instruction

	4- preparing frontend modules:
		* open separate terminal & cd ./capacity-planning-simulation/
			** cd capacity-planning-projection
				*** npm i
				*** tsc
			** cd ../types
				*** npm i
				*** tsc
			** cd ../pe-repository
				*** npm i
				*** tsc
			** cd ../
				*** npm i
				*** tsc
			** cd ./node-service
				*** npm i
				*** npm run-script build

	5- building frontend:
			* cd ../../
			* rm package-lock.json
			* npm i
			* ng serve -c local
			# http://localhost:4200/login: admin/ Admin!