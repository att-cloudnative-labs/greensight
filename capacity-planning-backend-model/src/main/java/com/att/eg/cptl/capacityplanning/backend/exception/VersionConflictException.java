package com.att.eg.cptl.capacityplanning.backend.exception;

public class VersionConflictException extends RuntimeException {
  public VersionConflictException(String message) {
    super(message);
  }
}
