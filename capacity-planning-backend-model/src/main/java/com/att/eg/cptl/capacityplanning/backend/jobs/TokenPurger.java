package com.att.eg.cptl.capacityplanning.backend.jobs;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class TokenPurger {

  @Scheduled(cron = "5 * * * * ?")
  public void purgeExpiredSessions() {
    /* not needed atm */
  }
}
