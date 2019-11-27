package com.att.eg.cptl.capacityplanning.backend.util;

import static com.google.common.net.HttpHeaders.AUTHORIZATION;
import static java.util.Optional.ofNullable;
import static org.apache.commons.lang3.StringUtils.removeStart;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import javax.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;

public class MiscUtil {
  private MiscUtil() {}

  public static Date stringToTimestamp(String date, String dateFormat) throws ParseException {
    SimpleDateFormat simpleDateFormat = new SimpleDateFormat(dateFormat);
    return simpleDateFormat.parse(date);
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
