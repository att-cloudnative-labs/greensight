package com.att.eg.cptl.capacityplanning.backend.util;

import com.att.eg.cptl.capacityplanning.backend.model.Session;
import java.time.LocalDateTime;

public class SessionUtils {
  private SessionUtils() {
    throw new IllegalAccessError("Utility class");
  }

  public static boolean isSessionExpired(Session session, long expirySeconds) {
    if (session == null || session.getIssueTime() == null) {
      return true;
    }

    LocalDateTime tokenExpiryTime = session.getIssueTime().plusSeconds(expirySeconds);

    if (LocalDateTime.now().isAfter(tokenExpiryTime)) {
      return true;
    }

    return false;
  }
}
