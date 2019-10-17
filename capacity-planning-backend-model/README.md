# capacity-planning-backend-model
## Synopsis

The Java-based **capacity-planning-backend-model** package provides project, simulation and system model REST controllers, system model Repository Data Access Objects (DAO) for MongoDB database abstraction, system model service interfaces (and their implementations), and system model model class definitions. System model model classes include branches, components, input variables, input wrappers, interface endpoints, labels, projects, and shapes. 

The **capacity-planning-backend-model** package defines simulation scheduling frequencies (once, hourly, daily, weekly, monthly), simulation states (queued, running, finished, etc.), and oversees the multi-threaded execution of the **TypeScript/JavaScript-based** simulation runtime, which is loaded from the **capacity-planning-simulation** package.

The **capacity-planning-backend-model** package supports configuration parameters for database connectivity (database hostname + database id) via annotations loaded from **src/main/resources/application.properties file** or as defined in the Spring Framework's spring.config.name field)


## Code Examples

Exposed REST API URI:
``` http
	http://BACKEND-MODEL-HOSTNAME:8080
```

## Dependencies & Prerequisites

Dependencies for building / running capacity-planning-backend-model:

	*  capacity-planning-simulation

Third-party libraries / packages:

	*  MongoDB
	*  Spring Boot (org.springframework.boot)
	*  Apache Maven (version >= 3.3.9)
	*  Java JDK/JRE (version >= 1.8.0)
	*  Lombok

Documentation Generation:

	*  SpringFox 
	*  Swagger-ui

## Unit Test Cases

	1.  ModelBranchControllerTest
	2.  ModelSimulationControllerTest

## Project Information
**Developers:**

	* Sahar Pure
	* Stephanie Murphy
	* George O'Donnell
	* Ben Willers
	* Huy Quang Pham
	* Adrian O'Connor	
	* Tim Papienski

## Project's CLI Reference

### Setup

### Run Service Locally with Tests

### Maven Tasks

Running without Tests (from project's root directory):
````bash
mvn clean install -DskipTests spring-boot:run
````

Using Maven Docker plugin to package then build (without Tests)
````bash
mvn package dockerfile:build -Dmaven.test.skip=true
````

Checking whether the Docker image created
````bash
docker image ls
````

Running the Docker image in container (cptl-be-model/modelbackend is the name of repository we just created, "1.0.3-SNAPSHOT" is the tag of Docker image)
````bash
docker run -p 8443:8443 cptl-be-model/modelbackend:1.0.3-SNAPSHOT
````
