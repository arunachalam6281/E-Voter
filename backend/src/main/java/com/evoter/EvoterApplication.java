package com.evoter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * EvoterApplication — Entry point of the Spring Boot application.
 *
 * @SpringBootApplication is a shortcut for three annotations:
 *   @Configuration      — marks this as a config source
 *   @EnableAutoConfiguration — lets Spring Boot auto-configure beans
 *   @ComponentScan      — scans all sub-packages for beans
 */
@SpringBootApplication
public class EvoterApplication {
    public static void main(String[] args) {
        SpringApplication.run(EvoterApplication.class, args);
    }
}
