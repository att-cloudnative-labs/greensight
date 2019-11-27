package com.att.eg.cptl.capacityplanning.backend.util;

import java.util.HashMap;
import java.util.Map;

public class Constants {
  public static final String TOKEN_BEARER = "Bearer";
  public static final String DATE_FORMAT = "MM-yyyy";
  public static final String MASTER_BRANCH_NAME = "Master";
  public static final String AUTHORIZATION = "Authorization";
  public static final String TIMESTAMP_TIME_ZONE = "UTC";
  public static final String ZONED_DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ssX";

  private Constants() {
    // private constructor to hide implicit public no-args one.
  }

  public static Map<String, Object> getDefaultUserSettings() {
    Map<String, Object> defaultUserSettings = new HashMap<>();
    defaultUserSettings.put("VARIABLE_DECIMAL", "1");
    defaultUserSettings.put("SIGMA", "10,20,30");
    defaultUserSettings.put("BREAKDOWN_DECIMAL", "2");
    defaultUserSettings.put("COMMA_CHECK", true);
    return defaultUserSettings;
  }
}
