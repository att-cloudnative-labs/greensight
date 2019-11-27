package com.att.eg.cptl.capacityplanning.backend.rest;

import org.springframework.http.HttpStatus;

public class RestResponse<T> {

  private HttpStatus status;
  private T data;
  private String errorMessage;

  public RestResponse() {
    super();
  }

  public RestResponse(HttpStatus status) {
    super();
    this.status = status;
  }

  public RestResponse(HttpStatus status, String errorMessage) {
    super();
    this.status = status;
    this.errorMessage = errorMessage;
  }

  public RestResponse(HttpStatus status, T data) {
    super();
    this.status = status;
    this.data = data;
  }

  public HttpStatus getStatus() {
    return status;
  }

  public void setStatus(HttpStatus status) {
    this.status = status;
  }

  public Object getData() {
    return data;
  }

  public void setData(T data) {
    this.data = data;
  }

  public String getErrorMessage() {
    return errorMessage;
  }

  public void setErrorMessage(String errorMessage) {
    this.errorMessage = errorMessage;
  }
}
