package com.att.eg.cptl.capacityplanning.backend.controller;

import com.att.eg.cptl.capacityplanning.backend.exception.*;
import java.io.IOException;
import javax.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class CptExceptionHandler {

  @ExceptionHandler(UnauthorizedException.class)
  public void handleUnauthorizedException(HttpServletResponse response, RuntimeException e)
      throws IOException {
    response.sendError(HttpStatus.UNAUTHORIZED.value(), e.getMessage());
  }

  @ExceptionHandler(ForbiddenException.class)
  public void handleForbiddenException(HttpServletResponse response, RuntimeException e)
      throws IOException {
    response.sendError(HttpStatus.FORBIDDEN.value(), e.getMessage());
  }

  @ExceptionHandler(NotFoundException.class)
  public void handleNotFoundException(HttpServletResponse response, RuntimeException e)
      throws IOException {
    response.sendError(HttpStatus.NOT_FOUND.value(), e.getMessage());
  }

  @ExceptionHandler(BadRequestException.class)
  public void handleBadRequestException(HttpServletResponse response, RuntimeException e)
      throws IOException {
    response.sendError(HttpStatus.BAD_REQUEST.value(), e.getMessage());
  }

  @ExceptionHandler(VersionConflictException.class)
  public void handleVersionConflictException(HttpServletResponse response, RuntimeException e)
      throws IOException {
    response.sendError(HttpStatus.CONFLICT.value(), e.getMessage());
  }

  @ExceptionHandler(DocumentExistsException.class)
  public void handleDocumentExistsException(HttpServletResponse response, RuntimeException e)
      throws IOException {
    response.sendError(HttpStatus.CONFLICT.value(), e.getMessage());
  }

  @ExceptionHandler(TrashStateException.class)
  public void handleTrashStateException(HttpServletResponse response, RuntimeException e)
      throws IOException {
    response.sendError(HttpStatus.GONE.value(), e.getMessage());
  }

  @ExceptionHandler(InvalidFilterTypeException.class)
  public void handleInvalidFilterTypeException(HttpServletResponse response, RuntimeException e)
      throws IOException {
    response.sendError(HttpStatus.BAD_REQUEST.value(), e.getMessage());
  }

  @ExceptionHandler(InvalidInputException.class)
  public void handleInvalidInputException(HttpServletResponse response, RuntimeException e)
      throws IOException {
    response.sendError(HttpStatus.BAD_REQUEST.value(), e.getMessage());
  }

  @ExceptionHandler(FailedDependencyException.class)
  public void handleFailedDependencyException(HttpServletResponse response, RuntimeException e)
      throws IOException {
    response.sendError(HttpStatus.FAILED_DEPENDENCY.value(), e.getMessage());
  }
}
