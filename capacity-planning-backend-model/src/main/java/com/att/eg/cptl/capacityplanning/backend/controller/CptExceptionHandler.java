package com.att.eg.cptl.capacityplanning.backend.controller;

import com.att.eg.cptl.capacityplanning.backend.exception.*;
import com.att.eg.cptl.capacityplanning.backend.rest.RestResponse;
import java.io.IOException;
import javax.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class CptExceptionHandler {

  @SuppressWarnings("rawtypes")
  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<RestResponse> handleUnauthorizedException(
      HttpServletResponse response, RuntimeException e) throws IOException {
    RestResponse restResponse = new RestResponse(HttpStatus.UNAUTHORIZED, e.getMessage());
    return new ResponseEntity<>(restResponse, HttpStatus.UNAUTHORIZED);
  }

  @SuppressWarnings("rawtypes")
  @ExceptionHandler(ForbiddenException.class)
  public ResponseEntity<RestResponse> handleForbiddenException(
      HttpServletResponse response, RuntimeException e) throws IOException {
    RestResponse restResponse = new RestResponse(HttpStatus.FORBIDDEN, e.getMessage());
    return new ResponseEntity<>(restResponse, HttpStatus.FORBIDDEN);
  }

  @SuppressWarnings("rawtypes")
  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<RestResponse> handleNotFoundException(
      HttpServletResponse response, RuntimeException e) throws IOException {
    RestResponse restResponse = new RestResponse(HttpStatus.NOT_FOUND, e.getMessage());
    return new ResponseEntity<>(restResponse, HttpStatus.NOT_FOUND);
  }

  @SuppressWarnings("rawtypes")
  @ExceptionHandler(BadRequestException.class)
  public ResponseEntity<RestResponse> handleBadRequestException(
      HttpServletResponse response, RuntimeException e) throws IOException {
    RestResponse restResponse = new RestResponse(HttpStatus.BAD_REQUEST, e.getMessage());
    return new ResponseEntity<>(restResponse, HttpStatus.BAD_REQUEST);
  }

  @SuppressWarnings("rawtypes")
  @ExceptionHandler(VersionConflictException.class)
  public ResponseEntity<RestResponse> handleVersionConflictException(
      HttpServletResponse response, RuntimeException e) throws IOException {
    RestResponse restResponse = new RestResponse(HttpStatus.CONFLICT, e.getMessage());
    return new ResponseEntity<>(restResponse, HttpStatus.CONFLICT);
  }

  @SuppressWarnings("rawtypes")
  @ExceptionHandler(DocumentExistsException.class)
  public ResponseEntity<RestResponse> handleDocumentExistsException(
      HttpServletResponse response, RuntimeException e) throws IOException {
    RestResponse restResponse = new RestResponse(HttpStatus.CONFLICT, e.getMessage());
    return new ResponseEntity<>(restResponse, HttpStatus.CONFLICT);
  }

  @SuppressWarnings("rawtypes")
  @ExceptionHandler(TrashStateException.class)
  public ResponseEntity<RestResponse> handleTrashStateException(
      HttpServletResponse response, RuntimeException e) throws IOException {
    RestResponse restResponse = new RestResponse(HttpStatus.GONE, e.getMessage());
    return new ResponseEntity<>(restResponse, HttpStatus.GONE);
  }

  @SuppressWarnings("rawtypes")
  @ExceptionHandler(InvalidFilterTypeException.class)
  public ResponseEntity<RestResponse> handleInvalidFilterTypeException(
      HttpServletResponse response, RuntimeException e) throws IOException {
    RestResponse restResponse = new RestResponse(HttpStatus.BAD_REQUEST, e.getMessage());
    return new ResponseEntity<>(restResponse, HttpStatus.BAD_REQUEST);
  }

  @SuppressWarnings("rawtypes")
  @ExceptionHandler(InvalidInputException.class)
  public ResponseEntity<RestResponse> handleInvalidInputException(
      HttpServletResponse response, RuntimeException e) throws IOException {
    RestResponse restResponse = new RestResponse(HttpStatus.BAD_REQUEST, e.getMessage());
    return new ResponseEntity<>(restResponse, HttpStatus.BAD_REQUEST);
  }

  @SuppressWarnings("rawtypes")
  @ExceptionHandler(FailedDependencyException.class)
  public ResponseEntity<RestResponse> handleFailedDependencyException(
      HttpServletResponse response, RuntimeException e) throws IOException {
    RestResponse restResponse = new RestResponse(HttpStatus.FAILED_DEPENDENCY, e.getMessage());
    return new ResponseEntity<>(restResponse, HttpStatus.FAILED_DEPENDENCY);
  }
}
