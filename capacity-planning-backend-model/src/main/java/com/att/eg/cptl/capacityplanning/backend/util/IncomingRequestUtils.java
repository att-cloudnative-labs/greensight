package com.att.eg.cptl.capacityplanning.backend.util;

import static java.util.Optional.ofNullable;
import static org.apache.commons.lang3.StringUtils.removeStart;
import static org.springframework.http.HttpHeaders.AUTHORIZATION;

import javax.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;

public class IncomingRequestUtils {
  private IncomingRequestUtils() {
    // private constructor to hide implicit public no-args constructor.
  }

  public static String getTokenFromRequest(HttpServletRequest request) {
    final String param =
        ofNullable(request.getHeader(AUTHORIZATION)).orElse(request.getParameter("t"));
    return ofNullable(param)
        .map(value -> removeStart(value, Constants.TOKEN_BEARER))
        .map(String::trim)
        .orElseThrow(() -> new BadCredentialsException("Missing Authentication Token"));
  }
}
