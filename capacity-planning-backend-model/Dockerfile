# Start with a base image containing Java runtime
FROM openjdk:8

# Add a volume pointing to /tmp
VOLUME /tmp

# The application's jar file
ARG JAR_FILE

# Add the application's jar to the container (example below)
COPY ${JAR_FILE} cpt-be-model.jar

# Run the jar file
ENTRYPOINT ["java","-Djava.security.egd=file:/dev/./urandom","-jar","/cpt-be-model.jar"]
