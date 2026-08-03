# ---- Build ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copia só o pom primeiro para cachear as dependências entre builds
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

COPY src ./src
RUN mvn -q -B -DskipTests package

# ---- Runtime ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
