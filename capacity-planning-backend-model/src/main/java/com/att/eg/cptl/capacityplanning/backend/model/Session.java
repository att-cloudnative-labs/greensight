package com.att.eg.cptl.capacityplanning.backend.model;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class Session {
  String id;
  String username;
  LocalDateTime issueTime;
}
