package com.att.eg.cptl.capacityplanning.backend.controller.util;

import com.att.eg.cptl.capacityplanning.backend.rest.RestResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * Utility for generating REST Responses with response codes. The status code from the response is
 * represented in the body of the response.
 */
public class RestResponseUtil {

  private RestResponseUtil() {
    // Hide implicit public constructor.
  }

  /**
   * Creates a simple response with the status code in the body.
   *
   * @param httpStatus The HttpStatus code to return in the body and from the HTTP call.
   * @return ResponseEntity with the above status codes.
   */
  public static ResponseEntity<RestResponse> createResponse(HttpStatus httpStatus) {
    return createResponse(httpStatus, null);
  }

  /**
   * Creates a response with the data in the data node of the body and the given httpStatus code
   * represented in the body and in the HTTP response.
   *
   * @param httpStatus The HttpStatus code to return in the body and from the HTTP call.
   * @param data The data to return in the response's data node.
   * @return ResponseEntity with the above status codes and data.
   */
  public static ResponseEntity<RestResponse> createResponse(HttpStatus httpStatus, Object data) {
    RestResponse restResponse = new RestResponse(httpStatus, data);
    return new ResponseEntity<>(restResponse, httpStatus);
  }

  /**
   * Creates a response with the error message in the errorMessage node of the body and the given
   * httpStatus code represented in the body and in the HTTP response.
   *
   * @param httpStatus The HttpStatus code to return in the body and from the HTTP call.
   * @param errorMessage The error message to return in the response's errorMessage node.
   * @return ResponseEntity with the above status codes and error message.
   */
  public static ResponseEntity<RestResponse> createResponse(
      HttpStatus httpStatus, String errorMessage) {
    RestResponse restResponse = new RestResponse(httpStatus, errorMessage);
    return new ResponseEntity<>(restResponse, httpStatus);
  }
}
