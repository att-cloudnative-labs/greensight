# common-capacity-planning-frontend

## Synopsis

The CPT frontend package contains all Angular7 TypeScript source code files, HTML view templates, Cascading Stylesheet (CSS) theming, TypeScript class definitions, and TypeScript interfaces needed for a generic webserver to serve a web-based GUI to the user. Also contained are the "environment.ts" configuration files needed to specify hostnames for the backend servers that provide the "apiUrl" and "modelApiUrl" REST endpoints for accessing authentication, variable, project, branch, forecasting, simulation, and other model data. 


## Usage Examples


``` http
http://SERVERHOSTNAME:4200
```


## Dependencies & Prerequisites
The following additional decoupled in-house developed backend components are required for operation & development (each of which are contained in a separate source repository):

	capacity-planning-backend
	capacity-planning-backend-common
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

	1- preparing modules:
		cd ./capacity-planning-simulation/
			* git submodule init
			* git submodule update
			* cd capacity-planning-projection
				** git submodule init
				** git submodule update
				** npm i
				** tsc
			* cd ../types
				** npm i
				** tsc
			* cd ../pe-repository
				** npm i
				** tsc
			* cd ../
				** npm i
				** tsc
			* cd ./node-service
				** npm i
				** npm run-script build
	2- building frontend:
			* cd ../../
			* rm package-lock.json
			* npm i
			* ng serve -c local
			# http://localhost:4200/login: admin/ Admin!