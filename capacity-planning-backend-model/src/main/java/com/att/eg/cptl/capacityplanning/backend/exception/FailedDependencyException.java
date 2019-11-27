package com.att.eg.cptl.capacityplanning.backend.exception;

public class FailedDependencyException extends RuntimeException {
  public FailedDependencyException(String message) {
    super(message);
  }
}
