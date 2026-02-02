# syntax=docker/dockerfile:1.6

# ------------------------------
# Builder stage: compile Spring Boot jar
# ------------------------------
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy Maven descriptor first to leverage Docker layer caching
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Copy the remaining project files
COPY src ./src

# Build the executable jar (skip tests for faster CI image builds)
RUN mvn -B clean package -DskipTests

# ------------------------------
# Runtime stage: lightweight JRE image
# ------------------------------
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# JVM performance tuning defaults can be overridden via JAVA_TOOL_OPTIONS
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:+UseContainerSupport"

# Copy jar from the builder image
COPY --from=build /app/target/*.jar /app/app.jar

EXPOSE 8080

# Allow passing extra JVM opts via JAVA_OPTS
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
