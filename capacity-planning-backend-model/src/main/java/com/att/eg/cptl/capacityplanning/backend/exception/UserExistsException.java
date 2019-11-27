package com.att.eg.cptl.capacityplanning.backend.exception;

public class UserExistsException extends BadRequestException {
  public UserExistsException(String message) {
    super(message);
  }
}
